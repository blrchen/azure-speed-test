import { DOCUMENT, isPlatformBrowser, Location } from '@angular/common'
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  OnInit,
  PLATFORM_ID,
} from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { Subscription, timer } from 'rxjs'

import { RegionModel } from '../../../models'
import { RegionService } from '../../../services/region.service'
import { SeoService } from '../../../services/seo.service'
import { CopyButtonComponent } from '../../../shared/copy-button/copy-button.component'
import { WidthPercentDirective } from '../../../shared/directives/width-percent.directive'
import { ExportCsvButtonComponent } from '../../../shared/export-csv-button/export-csv-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { RegionGroupComponent } from '../../../shared/region-group/region-group.component'
import {
  buildNormalizedRegionLookup,
  buildRegionDetailHref,
  buildRegionSelectionSignature,
  getSortedRegionIds,
  LatencyTone,
  parseRegionParam,
} from '../../../shared/utils'
import { ConnectionDetailsContainerComponent } from './connection-details-container.component'

const LATENCY_CONFIG = {
  MAX_PING_ATTEMPTS: 180,
  PING_INTERVAL_MS: 2000,
  MAX_PING_HISTORY: 20,
  MIN_STABLE_PING_SAMPLES: 3,
  MIN_OUTLIER_FILTER_SAMPLES: 8,
  PING_TIMEOUT_MS: 2000,
  SLOW_LATENCY_THRESHOLD_MS: 200,
  CONCURRENT_PINGS: 4,
  BATCH_UPDATE_DELAY_MS: 50,
  RESOURCE_TIMING_WAIT_MS: 100,
  LATENCY_FAST: 100,
} as const

const REGIONS_QUERY_PARAM = 'regions'

interface RegionLatencyRow extends RegionModel {
  median: LatencyDisplay
  latest: LatencyDisplay
  sampleCount: number
  tone: LatencyTone
  barWidthPercent: number
}

type PingMeasurementStatus = 'ok' | 'slow' | 'timeout' | 'error'
type PingDisplayStatus = PingMeasurementStatus | 'warming' | 'measuring'

const PING_STATUS_LABELS: Record<PingDisplayStatus, string> = {
  warming: 'Warming...',
  measuring: 'Measuring...',
  ok: 'OK',
  slow: 'Slow',
  timeout: 'Timeout',
  error: 'Error',
}

interface LatencyDisplay {
  latencyMs: number
  status: PingDisplayStatus
  label: string
  textClass: string
}

interface PingState {
  warmupComplete: boolean
  samples: readonly number[]
  latest: PingResult | null
}

interface PingResult {
  latencyMs: number
  status: PingMeasurementStatus
}

@Component({
  selector: 'app-azure-latency',
  imports: [
    RegionGroupComponent,
    RouterLink,
    LucideIconComponent,
    ConnectionDetailsContainerComponent,
    CopyButtonComponent,
    ExportCsvButtonComponent,
    WidthPercentDirective,
  ],
  templateUrl: './latency.component.html',
  host: { class: 'block' },
})
export class LatencyComponent implements OnInit {
  private readonly regionService = inject(RegionService)
  private readonly seoService = inject(SeoService)
  private readonly document = inject(DOCUMENT)
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly location = inject(Location)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  private readonly normalizedRegions = buildNormalizedRegionLookup(
    this.regionService.getAllRegions()
  )
  private lastUrlStateSignature = ''
  private canUpdateUrl = false
  private hasAppliedRegionsInput = false
  readonly regions = input<string | undefined>()
  private readonly selectedRegionIds = computed(() =>
    getSortedRegionIds(this.regionService.selectedRegions().map((region) => region.regionId))
  )
  readonly testLinkUrl = computed(() => {
    if (!this.isBrowser) return ''

    const sortedRegionIds = this.selectedRegionIds()
    if (!sortedRegionIds.length) return ''

    const href = this.document.defaultView?.location.href
    if (!href) return ''

    const url = new URL(href)
    url.searchParams.set(REGIONS_QUERY_PARAM, sortedRegionIds.join(','))
    return url.href
  })

  private readonly pingStateByStorageAccount = linkedSignal<
    readonly RegionModel[],
    ReadonlyMap<string, PingState>
  >({
    source: this.regionService.selectedRegions,
    computation: (regions, previous) => {
      const previousStates = previous?.value ?? new Map<string, PingState>()
      const nextStates = new Map<string, PingState>()

      for (const { storageAccountName } of regions) {
        const state = previousStates.get(storageAccountName)
        if (state) {
          nextStates.set(storageAccountName, state)
        }
      }

      return nextStates
    },
  })
  private pingAttemptCount = 0
  private isPingCycleRunning = false
  private isDestroyed = false

  private readonly activePingControllers = new Set<AbortController>()
  private readonly pendingPingUpdates = new Map<string, PingResult>()
  private readonly pendingResourceTimings = new Map<string, (durationMs: number | null) => void>()
  private batchUpdateTimer?: ReturnType<typeof setTimeout>
  private resourceTimingObserver?: PerformanceObserver

  readonly latencyRows = computed<RegionLatencyRow[]>(() => {
    const states = this.pingStateByStorageAccount()
    const regions = this.regionService.selectedRegions().map((region) => {
      const state = states.get(region.storageAccountName) ?? createPingState()
      const medianLatency = calculateStableMedian(state.samples)
      return {
        ...region,
        median: createLatencyDisplay(medianLatency, getPingDisplayStatus(state, medianLatency)),
        latest: getLatestDisplay(state),
        sampleCount: state.samples.length,
      }
    })

    regions.sort((left, right) => {
      if (left.median.latencyMs > 0 && right.median.latencyMs > 0) {
        return (
          left.median.latencyMs - right.median.latencyMs ||
          left.displayName.localeCompare(right.displayName)
        )
      }
      if (left.median.latencyMs > 0) return -1
      if (right.median.latencyMs > 0) return 1
      return left.displayName.localeCompare(right.displayName)
    })

    const maxLatency = regions.reduce((max, region) => Math.max(max, region.median.latencyMs), 0)
    return regions.map((region) => ({
      ...region,
      tone: getLatencyTone(region.median.latencyMs),
      barWidthPercent: getBarWidthPercent(region.median.latencyMs, maxLatency),
    }))
  })

  private readonly measuredLatencyRows = computed(() =>
    this.latencyRows().filter((region) => region.median.latencyMs > 0)
  )

  private readonly rankedLatencyRows = computed(() =>
    [...this.measuredLatencyRows()].sort(
      (left, right) =>
        left.median.latencyMs - right.median.latencyMs ||
        left.displayName.localeCompare(right.displayName)
    )
  )

  readonly topRegions = computed(() => this.rankedLatencyRows().slice(0, 3))
  readonly recommendationSlots = computed<readonly (RegionLatencyRow | null)[]>(() => {
    const top = this.topRegions()
    return [top[0] ?? null, top[1] ?? null, top[2] ?? null]
  })
  readonly bestRegionId = computed(() => this.rankedLatencyRows()[0]?.regionId ?? null)

  readonly measurementStatusText = computed(() => {
    const rows = this.latencyRows()
    if (rows.length === 0) return 'No regions selected.'

    const stableRegionCount = rows.filter(
      (row) => row.sampleCount >= LATENCY_CONFIG.MIN_STABLE_PING_SAMPLES
    ).length
    const regionLabel = rows.length === 1 ? 'region' : 'regions'

    if (stableRegionCount === 0) {
      return `Measuring latency for ${rows.length} ${regionLabel}.`
    }
    if (stableRegionCount < rows.length) {
      return `${stableRegionCount} of ${rows.length} regions have stable latency results.`
    }
    return `Latency ranking available for ${rows.length} ${regionLabel}. Results continue updating.`
  })

  protected buildRegionDetailHref = buildRegionDetailHref

  readonly csvHeaders = [
    'Geography',
    'Region',
    'Region ID',
    'Datacenter Location',
    'Median Latency (ms)',
    'Samples',
    'Latest',
    'Status',
  ]
  readonly csvRows = computed(() => {
    const data = this.rankedLatencyRows()
    if (data.length === 0) return null
    return data.map((row) => [
      row.geography,
      row.displayName,
      row.regionId,
      row.datacenterLocation,
      row.median.latencyMs.toString(),
      row.sampleCount.toString(),
      row.latest.label,
      getPingStatusLabel(row.median.status),
    ])
  })

  private pingSubscription?: Subscription

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.isDestroyed = true
      this.stopPingTimer()
      this.abortActivePingRequests()
      this.clearPendingPingUpdates()
      this.destroyResourceTimingObserver()
    })

    if (this.isBrowser) {
      this.initializeResourceTimingObserver()
      this.registerRegionsInputEffect()
      this.registerSelectedRegionsEffect()
    }
  }

  private registerRegionsInputEffect(): void {
    effect(() => {
      this.applyRegionsInput(this.regions())
    })
  }

  private registerSelectedRegionsEffect(): void {
    effect(() => {
      const selectedRegionIds = this.selectedRegionIds()

      this.syncUrlWithSelection(selectedRegionIds)

      if (!selectedRegionIds.length) {
        this.clearPendingPingUpdates()
        this.resetPingState()
        this.stopPingTimer()
        return
      }

      if (this.hasReachedPingLimit()) {
        this.clearPendingPingUpdates()
        this.resetPingState()
      }

      this.stopPingTimer()
      this.startPingTimer()
    })
  }

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure Latency Test | Measure Datacenter Latency',
      description:
        'Test latency from your location to Azure datacenters worldwide. Measure the latency to various Azure regions and find the closest Azure datacenters.',
      canonicalUrl: 'https://www.azurespeed.com/Azure/Latency',
    })
  }

  private applyRegionsInput(rawRegions: string | undefined): void {
    const parsedRegionTokens = parseRegionParam(rawRegions)
    const regions = parsedRegionTokens.length ? this.resolveRegionsFromIds(parsedRegionTokens) : []
    const shouldApplySelection =
      (typeof rawRegions === 'string' && rawRegions.trim().length > 0) ||
      this.hasAppliedRegionsInput

    if (shouldApplySelection) {
      this.lastUrlStateSignature = buildRegionSelectionSignature(
        regions.map((region) => region.regionId)
      )
      this.regionService.updateSelectedRegions(regions)
    }

    this.canUpdateUrl = true
    this.hasAppliedRegionsInput = true
  }

  private resolveRegionsFromIds(normalizedTokens: string[]): RegionModel[] {
    const seen = new Set<string>()
    return normalizedTokens
      .map((token) => this.normalizedRegions.get(token))
      .filter((match): match is RegionModel => {
        if (!match || seen.has(match.regionId)) return false
        seen.add(match.regionId)
        return true
      })
  }

  private syncUrlWithSelection(sortedRegionIds: readonly string[]): void {
    if (!this.isBrowser || !this.canUpdateUrl) return

    const signature = buildRegionSelectionSignature(sortedRegionIds)
    if (signature === this.lastUrlStateSignature) return

    this.lastUrlStateSignature = signature

    const queryParams = { ...this.route.snapshot.queryParams }
    if (sortedRegionIds.length) {
      queryParams[REGIONS_QUERY_PARAM] = sortedRegionIds.join(',')
    } else {
      delete queryParams[REGIONS_QUERY_PARAM]
    }

    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams,
    })
    this.location.replaceState(this.router.serializeUrl(urlTree))
  }

  private hasReachedPingLimit(): boolean {
    return this.pingAttemptCount >= LATENCY_CONFIG.MAX_PING_ATTEMPTS
  }

  private clearPendingPingUpdates(): void {
    this.pendingPingUpdates.clear()
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer)
      this.batchUpdateTimer = undefined
    }
  }

  private resetPingState(): void {
    this.pingAttemptCount = 0
    this.pingStateByStorageAccount.set(new Map())
  }

  private startPingTimer(): void {
    if (this.pingSubscription) return

    this.pingSubscription = timer(0, LATENCY_CONFIG.PING_INTERVAL_MS).subscribe(() => {
      if (this.hasReachedPingLimit()) {
        this.stopPingTimer()
        return
      }

      void this.pingAllRegions()
    })
  }

  private stopPingTimer(): void {
    if (!this.pingSubscription) return

    this.pingSubscription.unsubscribe()
    this.pingSubscription = undefined
  }

  private abortActivePingRequests(): void {
    for (const controller of this.activePingControllers) {
      controller.abort()
    }
    this.activePingControllers.clear()
  }

  private async pingAllRegions(): Promise<void> {
    if (this.isPingCycleRunning || this.isDestroyed) return

    this.isPingCycleRunning = true
    this.pingAttemptCount += 1

    try {
      const regions = shufflePingTargets(this.regionService.selectedRegions())

      for (let i = 0; i < regions.length; i += LATENCY_CONFIG.CONCURRENT_PINGS) {
        const chunk = regions.slice(i, i + LATENCY_CONFIG.CONCURRENT_PINGS)
        await Promise.allSettled(chunk.map((region) => this.pingRegion(region)))
      }
    } finally {
      this.isPingCycleRunning = false
    }
  }

  private async pingRegion(region: RegionModel): Promise<void> {
    if (this.isDestroyed || !this.isBrowser || !region.storageAccountName || !region.regionId)
      return

    const url = `https://${region.storageAccountName}.blob.core.windows.net/public/latency-test.json`
    const requestUrl = `${url}?_=${createCacheBuster()}`
    const resourceTimingPromise = this.createResourceTimingWaiter(requestUrl)
    const controller = new AbortController()
    this.activePingControllers.add(controller)
    const timeoutId = setTimeout(() => controller.abort(), LATENCY_CONFIG.PING_TIMEOUT_MS)

    try {
      const startTime = performance.now()

      const response = await fetch(requestUrl, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache',
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        this.queuePingUpdate(region.storageAccountName, {
          status: 'error',
          latencyMs: 0,
        })
        return
      }

      const wallClockLatencyMs = performance.now() - startTime
      const resourceTimingLatencyMs = await this.getResourceTimingLatency(
        requestUrl,
        resourceTimingPromise
      )
      const latencyMs = Math.round(resourceTimingLatencyMs ?? wallClockLatencyMs)
      this.queuePingUpdate(region.storageAccountName, {
        latencyMs,
        status: latencyMs >= LATENCY_CONFIG.SLOW_LATENCY_THRESHOLD_MS ? 'slow' : 'ok',
      })
    } catch (error) {
      this.queuePingUpdate(region.storageAccountName, {
        status: isAbortError(error) ? 'timeout' : 'error',
        latencyMs: 0,
      })
    } finally {
      clearTimeout(timeoutId)
      this.activePingControllers.delete(controller)
      this.cancelResourceTimingWaiter(requestUrl)
    }
  }

  private initializeResourceTimingObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntriesByType('resource')) {
        this.resolveResourceTiming(entry.name, getValidResourceTimingDuration(entry.duration))
      }
    })

    try {
      observer.observe({ entryTypes: ['resource'] })
      this.resourceTimingObserver = observer
    } catch {
      observer.disconnect()
    }
  }

  private destroyResourceTimingObserver(): void {
    this.resourceTimingObserver?.disconnect()
    this.resourceTimingObserver = undefined

    for (const resolve of this.pendingResourceTimings.values()) {
      resolve(null)
    }
    this.pendingResourceTimings.clear()
  }

  private createResourceTimingWaiter(requestUrl: string): Promise<number | null> | null {
    if (!this.resourceTimingObserver) return null

    return new Promise((resolve) => {
      this.pendingResourceTimings.set(requestUrl, resolve)
    })
  }

  private async getResourceTimingLatency(
    requestUrl: string,
    observedTiming: Promise<number | null> | null
  ): Promise<number | null> {
    const bufferedTiming = this.getBufferedResourceTiming(requestUrl)
    if (bufferedTiming !== null) {
      this.cancelResourceTimingWaiter(requestUrl)
      return bufferedTiming
    }

    if (!observedTiming) return null

    const durationMs = await waitForResourceTiming(observedTiming)
    this.cancelResourceTimingWaiter(requestUrl)
    return durationMs ?? this.getBufferedResourceTiming(requestUrl)
  }

  private getBufferedResourceTiming(requestUrl: string): number | null {
    const entries = performance.getEntriesByName(requestUrl, 'resource')
    if (entries.length === 0) return null

    const entry = entries[entries.length - 1]
    return getValidResourceTimingDuration(entry.duration)
  }

  private resolveResourceTiming(requestUrl: string, durationMs: number | null): void {
    const resolve = this.pendingResourceTimings.get(requestUrl)
    if (!resolve) return

    this.pendingResourceTimings.delete(requestUrl)
    resolve(durationMs)
  }

  private cancelResourceTimingWaiter(requestUrl: string): void {
    this.resolveResourceTiming(requestUrl, null)
  }

  private queuePingUpdate(storageAccountName: string, update: PingResult): void {
    if (this.isDestroyed) return

    this.pendingPingUpdates.set(storageAccountName, update)
    this.schedulePingUpdateFlush()
  }

  private schedulePingUpdateFlush(): void {
    this.batchUpdateTimer ??= setTimeout(() => {
      this.batchUpdateTimer = undefined
      if (this.isDestroyed) return
      this.flushPingUpdates()
    }, LATENCY_CONFIG.BATCH_UPDATE_DELAY_MS)
  }

  private flushPingUpdates(): void {
    if (!this.pendingPingUpdates.size) return

    const updates = new Map(this.pendingPingUpdates)
    this.pendingPingUpdates.clear()

    const selectedStorageAccounts = new Set(
      this.regionService.selectedRegions().map((region) => region.storageAccountName)
    )
    if (!selectedStorageAccounts.size) return

    this.pingStateByStorageAccount.update((currentStates) => {
      const states = new Map(currentStates)
      let hasUpdates = false

      for (const [name, update] of updates) {
        if (!selectedStorageAccounts.has(name)) continue

        states.set(name, applyPingUpdate(states.get(name) ?? createPingState(), update))
        hasUpdates = true
      }

      return hasUpdates ? states : currentStates
    })
  }
}

function createPingState(): PingState {
  return {
    warmupComplete: false,
    samples: [],
    latest: null,
  }
}

function applyPingUpdate(state: PingState, update: PingResult): PingState {
  if (!state.warmupComplete) {
    return {
      ...state,
      warmupComplete: true,
      latest: isFailedPingStatus(update.status) ? update : null,
    }
  }

  if (isFailedPingStatus(update.status)) {
    return {
      ...state,
      latest: update,
    }
  }

  const samples = [...state.samples, update.latencyMs]
  if (samples.length > LATENCY_CONFIG.MAX_PING_HISTORY) {
    samples.shift()
  }

  return {
    warmupComplete: true,
    samples,
    latest: update,
  }
}

function getLatestDisplay(state: PingState): LatencyDisplay {
  if (state.latest) {
    return createLatencyDisplay(state.latest.latencyMs, state.latest.status)
  }

  return createLatencyDisplay(0, state.warmupComplete ? 'measuring' : 'warming')
}

function getPingDisplayStatus(state: PingState, medianLatency: number): PingDisplayStatus {
  if (medianLatency >= LATENCY_CONFIG.SLOW_LATENCY_THRESHOLD_MS) return 'slow'
  if (medianLatency > 0) return 'ok'
  if (!state.latest) return state.warmupComplete ? 'measuring' : 'warming'
  if (isFailedPingStatus(state.latest.status)) return state.latest.status
  return 'measuring'
}

function createLatencyDisplay(latencyMs: number, status: PingDisplayStatus): LatencyDisplay {
  return {
    latencyMs,
    status,
    label: latencyMs > 0 ? `${latencyMs} ms` : getPingStatusLabel(status),
    textClass: getPingTextClass(status, latencyMs),
  }
}

function getPingStatusLabel(status: PingDisplayStatus): string {
  return PING_STATUS_LABELS[status]
}

function isFailedPingStatus(status: PingMeasurementStatus): status is 'timeout' | 'error' {
  return status === 'timeout' || status === 'error'
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  )
}

function getLatencyTone(latency: number | null | undefined): LatencyTone {
  if (typeof latency !== 'number' || latency <= 0) return 'unknown'
  if (latency < LATENCY_CONFIG.LATENCY_FAST) return 'fast'
  if (latency < LATENCY_CONFIG.SLOW_LATENCY_THRESHOLD_MS) return 'moderate'
  return 'slow'
}

function getPingTextClass(status: PingDisplayStatus, latency: number): string {
  if (status === 'timeout' || status === 'error') return 'text-danger-dark dark:text-danger'
  if (status === 'warming' || status === 'measuring') return 'text-text-muted'

  switch (getLatencyTone(latency)) {
    case 'fast':
      return 'text-success-foreground dark:text-success'
    case 'moderate':
      return 'text-warning-foreground dark:text-warning'
    case 'slow':
      return 'text-danger-dark dark:text-danger'
    default:
      return 'text-text-muted'
  }
}

function createCacheBuster(): string {
  const browserCrypto = globalThis.crypto
  return typeof browserCrypto.randomUUID === 'function'
    ? browserCrypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getBarWidthPercent(medianLatency: number, maxLatency: number): number {
  return maxLatency > 0 ? (medianLatency / maxLatency) * 100 : 0
}

function shufflePingTargets(targets: readonly RegionModel[]): RegionModel[] {
  const shuffled = [...targets]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = current
  }
  return shuffled
}

function calculateStableMedian(values: readonly number[]): number {
  if (values.length < LATENCY_CONFIG.MIN_STABLE_PING_SAMPLES) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const filtered = removeOutliers(sorted)
  return calculateMedian(filtered)
}

function calculateMedian(sorted: readonly number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid]
}

function removeOutliers(sorted: readonly number[]): readonly number[] {
  if (sorted.length < LATENCY_CONFIG.MIN_OUTLIER_FILTER_SAMPLES) return sorted

  const q1 = getPercentile(sorted, 0.25)
  const q3 = getPercentile(sorted, 0.75)
  const iqr = q3 - q1
  if (iqr === 0) return sorted

  const filtered = sorted.filter((v) => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr)
  return filtered.length >= LATENCY_CONFIG.MIN_STABLE_PING_SAMPLES ? filtered : sorted
}

function getPercentile(sorted: readonly number[], percentile: number): number {
  const index = (sorted.length - 1) * percentile
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.ceil(index)
  if (lowerIndex === upperIndex) return sorted[lowerIndex]

  const upperWeight = index - lowerIndex
  return sorted[lowerIndex] * (1 - upperWeight) + sorted[upperIndex] * upperWeight
}

function getValidResourceTimingDuration(durationMs: number): number | null {
  return Number.isFinite(durationMs) && durationMs > 0 ? durationMs : null
}

function waitForResourceTiming(timing: Promise<number | null>): Promise<number | null> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => resolve(null), LATENCY_CONFIG.RESOURCE_TIMING_WAIT_MS)

    void timing.then((durationMs) => {
      clearTimeout(timeoutId)
      resolve(durationMs)
    })
  })
}
