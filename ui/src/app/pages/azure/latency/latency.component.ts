import { CommonModule, isPlatformBrowser } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EffectRef,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  untracked
} from '@angular/core'
import { colorSets, DataItem, LegendPosition, NgxChartsModule } from '@swimlane/ngx-charts'
import { curveBasis } from 'd3-shape'
import { Subscription, timer } from 'rxjs'
import { RegionModel } from '../../../models'
import { RegionService, SeoService } from '../../../services'
import { RegionGroupComponent } from '../../shared'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { HeroIconComponent } from '../../../shared/icons/hero-icons.imports'

// Single source of truth - minimal state
interface RegionPingData {
  regionId: string
  geography: string
  displayName: string
  datacenterLocation: string
  storageAccountName: string

  // Only store raw ping history - everything else is computed
  pingHistory: number[]
  lastPingTime: number
}

interface RegionWithLatencyMetrics extends RegionPingData {
  medianLatency: number
  currentLatency: number
}

interface ChartSeries {
  name: string
  series: DataItem[]
  storageAccountName: string
}

interface LatencyState {
  regions: Map<string, RegionPingData>
  pingAttemptCount: number
  isTestRunning: boolean
}

@Component({
  selector: 'app-azure-latency',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, RegionGroupComponent, RouterLink, HeroIconComponent],
  templateUrl: './latency.component.html',
  styleUrl: './latency.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LatencyComponent implements OnInit, OnDestroy {
  private readonly regionService = inject(RegionService)
  private readonly seoService = inject(SeoService)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly isBrowser = isPlatformBrowser(this.platformId)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly allRegions = this.regionService.getAllRegions()
  private readonly normalizedRegions = this.buildNormalizedRegionLookup(this.allRegions)
  private readonly regionsParamKey = 'regions'
  private lastUrlStateSignature = ''
  private canUpdateUrl = false
  public readonly shareUrl = signal('')
  public readonly copyStatus = signal<'idle' | 'copied' | 'failed'>('idle')
  public readonly isCopyIdle = computed(() => this.copyStatus() === 'idle')
  public readonly isCopySuccess = computed(() => this.copyStatus() === 'copied')
  public readonly isCopyError = computed(() => this.copyStatus() === 'failed')
  private copyFeedbackTimeout: ReturnType<typeof setTimeout> | null = null

  // Configuration constants
  private static readonly CONFIG = {
    MAX_PING_ATTEMPTS: 180,
    PING_INTERVAL_MS: 2000,
    CHART_POINTS: 60,
    MAX_PING_HISTORY: 20,
    PING_TIMEOUT_MS: 2000,
    MAX_ACCEPTABLE_LATENCY_MS: 500,
    CONCURRENT_PINGS: 4,
    BATCH_UPDATE_DELAY_MS: 50,
    LATENCY_FAST: 100,
    LATENCY_ACCEPTABLE: 200
  } as const

  // Single state signal - minimal source of truth
  private state = signal<LatencyState>({
    regions: new Map(),
    pingAttemptCount: 0,
    isTestRunning: false
  })

  // Batch update mechanism
  private pendingPingUpdates = new Map<string, number>()
  private batchUpdateTimer?: ReturnType<typeof setTimeout>
  // Cache chart data to avoid regenerating entire series on every latency tick
  private readonly chartTimeline = signal<string[]>([])
  private readonly chartSeriesSignal = signal<ChartSeries[]>([])

  // All derived data as computed signals - no manual updates needed
  public regionsWithMedian = computed<RegionWithLatencyMetrics[]>(() => {
    const regions = Array.from(this.state().regions.values())
    return regions.map((region) => ({
      ...region,
      medianLatency: this.calculateMedian(region.pingHistory),
      currentLatency: region.pingHistory[region.pingHistory.length - 1] || 0
    }))
  })

  private regionsWithLatency = computed<RegionWithLatencyMetrics[]>(() => {
    return this.regionsWithMedian().filter((region) => region.medianLatency > 0)
  })

  public tableData = computed<RegionWithLatencyMetrics[]>(() => {
    const regions = this.regionsWithLatency()
    return regions.length ? [...regions].sort((a, b) => a.medianLatency - b.medianLatency) : []
  })

  public tableDataTop3 = computed<RegionWithLatencyMetrics[]>(() => this.tableData().slice(0, 3))
  public bestRegion = computed<RegionWithLatencyMetrics | null>(() => {
    const top = this.tableDataTop3()
    return top.length ? top[0] : null
  })
  public runnerUpRegions = computed<RegionWithLatencyMetrics[]>(() => {
    const top = this.tableDataTop3()
    return top.length > 1 ? top.slice(1) : []
  })

  protected getLatencyBadgeState(
    latency: number | null | undefined
  ): 'fast' | 'moderate' | 'slow' | 'unknown' {
    if (!this.hasValidLatency(latency)) {
      return 'unknown'
    }
    if (latency < LatencyComponent.CONFIG.LATENCY_FAST) {
      return 'fast'
    }
    if (latency < LatencyComponent.CONFIG.LATENCY_ACCEPTABLE) {
      return 'moderate'
    }
    return 'slow'
  }

  private hasValidLatency(latency: number | null | undefined): latency is number {
    return typeof latency === 'number' && latency > 0
  }

  public chartDataSeries = computed<ChartSeries[]>(() => {
    const activeRegions = this.regionsWithLatency()
    if (!activeRegions.length) {
      return []
    }

    const allowed = new Set(
      activeRegions
        .map((region) => region.storageAccountName)
        .filter((name): name is string => Boolean(name))
    )

    if (!allowed.size) {
      return []
    }

    return this.chartSeriesSignal().filter((series) => allowed.has(series.storageAccountName))
  })

  public xAxisTicks = computed<string[]>(() => {
    if (!this.chartDataSeries().length) {
      return []
    }

    const timeline = this.chartTimeline()
    if (!timeline.length) return []

    // Filter to every 5 seconds to reduce x-axis clutter
    return timeline.filter((label) => {
      const parts = label.split(':').map(Number)
      if (parts.length < 2) return false
      const seconds = parts[1]
      return Number.isFinite(seconds) && seconds % 5 === 0
    })
  })

  // Chart configuration (static, no state needed)
  public colorScheme = colorSets.find((s) => s.name === 'picnic') || colorSets[0]
  public curve = curveBasis
  public legendPosition: LegendPosition = LegendPosition.Below

  // TrackBy functions for optimal rendering performance
  readonly trackByRegionData = (_: number, item: RegionWithLatencyMetrics): string =>
    item.storageAccountName || item.regionId || item.displayName

  private pingSubscription?: Subscription
  private readonly selectedRegionsEffect: EffectRef | null = this.isBrowser
    ? effect(() => {
        const regions = this.regionService.selectedRegions()
        const hasSelection = regions.length > 0
        const hasReachedLimit = untracked(() => {
          const currentState = this.state()
          return currentState.pingAttemptCount >= LatencyComponent.CONFIG.MAX_PING_ATTEMPTS
        })

        this.syncUrlWithSelection(regions)

        if (!hasSelection) {
          this.pendingPingUpdates.clear()
          this.initializeRegions([], { resetPingState: true })
          this.stopPingTimer()
          return
        }

        if (hasReachedLimit) {
          this.pendingPingUpdates.clear()
          this.stopPingTimer()
        }

        this.initializeRegions(regions, { resetPingState: hasReachedLimit })

        if (!this.pingSubscription) {
          this.startPingTimer()
        }
      })
    : null

  ngOnInit(): void {
    this.initializeSeoProperties()
    this.applyInitialUrlState()
  }

  ngOnDestroy(): void {
    this.selectedRegionsEffect?.destroy()
    this.stopPingTimer()
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer)
    }
    if (this.copyFeedbackTimeout) {
      clearTimeout(this.copyFeedbackTimeout)
      this.copyFeedbackTimeout = null
    }
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Latency Test | Measure Datacenter Latency')
    this.seoService.setMetaDescription(
      'Test latency from your location to Azure datacenters worldwide. Measure the latency to various Azure regions and find the closest Azure datacenters.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/Latency')
  }

  private applyInitialUrlState(): void {
    if (!this.isBrowser) return

    const rawRegions = this.route.snapshot.queryParamMap.get(this.regionsParamKey)
    const parsedRegionTokens = this.parseRegionParam(rawRegions)
    const regions = parsedRegionTokens.length ? this.resolveRegionsFromIds(parsedRegionTokens) : []
    const hasSelection = regions.length > 0

    if (hasSelection) {
      this.lastUrlStateSignature = this.buildSignature(regions.map((region) => region.regionId))
      this.regionService.updateSelectedRegions(regions)
    }

    this.updateShareUrl(hasSelection)
    if (!hasSelection) {
      this.setCopyStatus('idle')
    }

    this.canUpdateUrl = true
  }

  private parseRegionParam(raw: string | null): string[] {
    if (!raw) return []
    const tokens = new Set<string>()
    const sanitized = raw.replace(/[|;]/g, ',')
    for (const part of sanitized.split(',')) {
      const token = this.normalizeToken(part)
      if (token) {
        tokens.add(token)
      }
    }
    return Array.from(tokens)
  }

  private normalizeToken(value: string | null | undefined): string {
    if (value == null) return ''
    return value
      .toLowerCase()
      .replace(/[\s/_-]+/g, '')
      .replace(/[^a-z0-9]/g, '')
  }

  private resolveRegionsFromIds(regionTokens: string[]): RegionModel[] {
    if (!regionTokens.length) {
      return []
    }

    const selected: RegionModel[] = []
    const seen = new Set<string>()

    for (const token of regionTokens) {
      const key = this.normalizeToken(token)
      if (!key) continue
      const match = this.normalizedRegions.get(key)
      if (match && !seen.has(match.regionId)) {
        seen.add(match.regionId)
        selected.push(match)
      }
    }

    return selected
  }

  private buildSignature(regionIds: string[], options: { alreadySorted?: boolean } = {}): string {
    const normalizedIds = regionIds.map((id) => this.normalizeToken(id))
    if (!options.alreadySorted) {
      normalizedIds.sort()
    }
    return normalizedIds.join(',')
  }

  private buildNormalizedRegionLookup(regions: RegionModel[]): Map<string, RegionModel> {
    const lookup = new Map<string, RegionModel>()
    for (const region of regions) {
      const key = this.normalizeToken(region.regionId)
      if (key && !lookup.has(key)) {
        lookup.set(key, region)
      }
    }
    return lookup
  }

  private syncUrlWithSelection(regions: RegionModel[]): void {
    if (!this.isBrowser || !this.canUpdateUrl) return

    const regionIds = regions.map((region) => region.regionId)
    const sortedRegionIds = [...regionIds].sort((a, b) => a.localeCompare(b))
    const normalizedRegionSignature = this.buildSignature(sortedRegionIds, { alreadySorted: true })
    if (normalizedRegionSignature === this.lastUrlStateSignature) {
      return
    }

    this.lastUrlStateSignature = normalizedRegionSignature

    const queryParams = { ...this.route.snapshot.queryParams }
    if (sortedRegionIds.length) {
      queryParams[this.regionsParamKey] = sortedRegionIds.join(',')
    } else {
      delete queryParams[this.regionsParamKey]
    }

    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl: true
      })
      .finally(() => this.updateShareUrl(sortedRegionIds.length > 0))
  }

  private updateShareUrl(hasSelection: boolean): void {
    if (!this.isBrowser) return
    if (!hasSelection) {
      this.shareUrl.set('')
      this.setCopyStatus('idle')
      return
    }
    this.shareUrl.set(window.location.href)
  }

  async copyShareUrl(): Promise<void> {
    if (!this.isBrowser) return
    const url = this.shareUrl()
    if (!url) return

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
      }

      await navigator.clipboard.writeText(url)
      this.setCopyStatus('copied')
    } catch (error) {
      console.error('Failed to copy latency share link', error)
      this.setCopyStatus('failed')
      this.focusShareInput()
    }
  }

  private focusShareInput(): void {
    if (!this.isBrowser) return

    const shareInput = document.getElementById('latency-share-input')
    if (shareInput instanceof HTMLInputElement) {
      shareInput.focus()
      shareInput.select()
    }
  }

  private setCopyStatus(status: 'idle' | 'copied' | 'failed'): void {
    this.copyStatus.set(status)
    if (this.copyFeedbackTimeout) {
      clearTimeout(this.copyFeedbackTimeout)
      this.copyFeedbackTimeout = null
    }
    if (status === 'idle') {
      return
    }
    this.copyFeedbackTimeout = setTimeout(() => {
      this.copyStatus.set('idle')
      this.copyFeedbackTimeout = null
    }, 3000)
  }

  selectShareInput(event: FocusEvent): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      target.select()
    }
  }

  private initializeRegions(
    regions: RegionModel[],
    options: { resetPingState?: boolean } = {}
  ): void {
    const resetPingState = options.resetPingState ?? false
    // Get the current state to preserve existing ping history
    const currentState = untracked(() => this.state())
    const currentRegions = currentState.regions

    const regionMap = new Map(
      regions
        .filter((region) => region.storageAccountName)
        .map((region) => {
          const storageAccountName = region.storageAccountName

          // Check if this region already exists and has ping history
          const existingRegion = currentRegions.get(storageAccountName)

          return [
            storageAccountName,
            {
              regionId: region.regionId,
              geography: region.geography,
              displayName: region.displayName,
              datacenterLocation: region.datacenterLocation,
              storageAccountName: region.storageAccountName,
              // Preserve existing ping history unless we are kicking off a fresh run
              pingHistory: resetPingState ? [] : existingRegion?.pingHistory || [],
              lastPingTime: resetPingState ? 0 : existingRegion?.lastPingTime || 0
            }
          ]
        })
    )

    const hasRegions = regionMap.size > 0

    this.state.set({
      regions: regionMap,
      // Reset ping attempt count when starting a new run or when no regions are selected
      pingAttemptCount: resetPingState || !hasRegions ? 0 : currentState.pingAttemptCount || 0,
      isTestRunning: hasRegions && !resetPingState ? currentState.isTestRunning : false
    })

    if (!hasRegions || resetPingState) {
      this.chartTimeline.set([])
      this.chartSeriesSignal.set([])
    } else {
      this.syncChartSeriesWithRegions(regionMap)
    }
  }

  private syncChartSeriesWithRegions(regions: Map<string, RegionPingData>): void {
    this.chartSeriesSignal.update((current) => {
      const timeline = this.chartTimeline()
      const existing = new Map(current.map((series) => [series.storageAccountName, series]))
      const nextSeries: ChartSeries[] = []
      let mutated = false

      for (const region of regions.values()) {
        const storageAccountName = region.storageAccountName
        if (!storageAccountName) continue

        const match = existing.get(storageAccountName)
        if (match) {
          if (match.name !== region.displayName) {
            match.name = region.displayName
            mutated = true
          }
          nextSeries.push(match)
          existing.delete(storageAccountName)
        } else {
          const series: DataItem[] = timeline.map((label) => ({
            name: label,
            value: 0
          }))

          nextSeries.push({
            name: region.displayName,
            series,
            storageAccountName
          })
          mutated = true
        }
      }

      if (existing.size > 0 || nextSeries.length !== current.length) {
        mutated = true
      }

      return mutated ? nextSeries : current
    })
  }

  private startPingTimer(): void {
    if (this.pingSubscription) {
      return
    }

    this.state.update((state) => ({ ...state, isTestRunning: true }))

    this.pingSubscription = timer(0, LatencyComponent.CONFIG.PING_INTERVAL_MS).subscribe(() => {
      const currentState = this.state()
      if (currentState.pingAttemptCount >= LatencyComponent.CONFIG.MAX_PING_ATTEMPTS) {
        this.stopPingTimer()
        return
      }

      void this.pingAllRegions()
      this.state.update((state) => ({
        ...state,
        pingAttemptCount: state.pingAttemptCount + 1
      }))
    })
  }

  private stopPingTimer(): void {
    if (!this.pingSubscription) {
      return
    }

    this.pingSubscription.unsubscribe()
    this.pingSubscription = undefined
    this.state.update((state) => ({ ...state, isTestRunning: false }))
  }

  private async pingAllRegions(): Promise<void> {
    const { CONCURRENT_PINGS } = LatencyComponent.CONFIG

    const regions = Array.from(this.state().regions.values())

    // Process in chunks for concurrency control
    for (let i = 0; i < regions.length; i += CONCURRENT_PINGS) {
      const chunk = regions.slice(i, i + CONCURRENT_PINGS)
      await Promise.allSettled(chunk.map((region) => this.pingRegion(region)))
    }
  }

  private async pingRegion(region: RegionPingData): Promise<void> {
    if (!this.isBrowser) return
    if (!region.storageAccountName || !region.regionId) return

    const url = `https://${region.storageAccountName}.blob.core.windows.net/public/latency-test.json`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), LatencyComponent.CONFIG.PING_TIMEOUT_MS)

    try {
      const startTime = performance.now()

      const response = await fetch(`${url}?_=${Date.now()}`, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache'
      })

      if (!response.ok) return

      const endTime = performance.now()
      const latency = Math.round(endTime - startTime)

      // Add to batch update queue
      this.queuePingUpdate(region.storageAccountName, latency)
    } catch {
      // Silent fail for ping errors
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private queuePingUpdate(storageAccountName: string, latency: number): void {
    const { MAX_ACCEPTABLE_LATENCY_MS, BATCH_UPDATE_DELAY_MS } = LatencyComponent.CONFIG

    if (latency > MAX_ACCEPTABLE_LATENCY_MS) return

    this.pendingPingUpdates.set(storageAccountName, latency)

    // Batch updates to reduce state operations
    if (!this.batchUpdateTimer) {
      this.batchUpdateTimer = setTimeout(() => {
        this.flushPingUpdates()
        this.batchUpdateTimer = undefined
      }, BATCH_UPDATE_DELAY_MS)
    }
  }

  private flushPingUpdates(): void {
    if (this.pendingPingUpdates.size === 0) return

    const updates = new Map(this.pendingPingUpdates)
    this.pendingPingUpdates.clear()
    let updatedRegions: Map<string, RegionPingData> | null = null

    this.state.update((currentState) => {
      const regions = new Map(currentState.regions)
      const timestamp = Date.now()

      for (const [name, latency] of updates) {
        const region = regions.get(name)
        if (!region) continue

        // Update ping history (single source of truth)
        const history = [...region.pingHistory, latency]
        if (history.length > LatencyComponent.CONFIG.MAX_PING_HISTORY) {
          history.shift()
        }

        regions.set(name, {
          ...region,
          pingHistory: history,
          lastPingTime: timestamp
        })
      }

      updatedRegions = regions

      return {
        ...currentState,
        regions
      }
    })

    if (updatedRegions) {
      this.updateChartData(updatedRegions, updates)
    }
  }

  private updateChartData(
    regions: Map<string, RegionPingData>,
    updates: Map<string, number>
  ): void {
    const { CHART_POINTS } = LatencyComponent.CONFIG
    const timestamp = Date.now()
    const currentTimeline = this.chartTimeline()
    let nextTimeline: string[]

    if (currentTimeline.length === 0) {
      nextTimeline = Array.from({ length: CHART_POINTS }, (_, index) =>
        this.formatXAxisTick(timestamp - (CHART_POINTS - 1 - index) * 1000)
      )
    } else {
      nextTimeline = [...currentTimeline, this.formatXAxisTick(timestamp)]
      const overflow = Math.max(0, nextTimeline.length - CHART_POINTS)
      if (overflow > 0) {
        nextTimeline.splice(0, overflow)
      }
    }

    this.chartTimeline.set(nextTimeline)

    this.syncChartSeriesWithRegions(regions)

    if (!nextTimeline.length) {
      return
    }

    const historicalLabels = nextTimeline.slice(0, nextTimeline.length - 1)
    const latestLabel = nextTimeline[nextTimeline.length - 1]

    this.chartSeriesSignal.update((current) => {
      let mutated = false
      const next = current.map((series) => {
        const data = series.series

        const hasNewLatency = updates.has(series.storageAccountName)
        if (!hasNewLatency && data.length === 0) {
          return series
        }

        const previousValue = data.length ? data[data.length - 1].value : 0
        const nextValue = hasNewLatency ? updates.get(series.storageAccountName)! : previousValue

        if (data.length === 0) {
          for (const label of historicalLabels) {
            data.push({ name: label, value: 0 })
          }
        } else {
          while (data.length > historicalLabels.length) {
            data.shift()
          }
          while (data.length < historicalLabels.length) {
            const value = data.length ? data[0].value : 0
            data.unshift({ name: '', value })
          }
          for (let i = 0; i < historicalLabels.length && i < data.length; i++) {
            data[i].name = historicalLabels[i]
          }
        }

        data.push({
          name: latestLabel,
          value: nextValue
        })

        if (data.length > nextTimeline.length) {
          data.splice(0, data.length - nextTimeline.length)
        }

        const startIndex = nextTimeline.length - data.length
        for (let i = 0; i < data.length; i++) {
          data[i].name = nextTimeline[startIndex + i]
        }

        mutated = true
        return series
      })

      return mutated ? [...next] : current
    })
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0
    if (values.length === 1) return values[0]

    const sorted = [...values].sort((a, b) => a - b)

    // Simple outlier removal for small samples
    if (sorted.length <= 5 && sorted.length > 2) {
      sorted.pop() // Remove highest
    }

    // IQR method for larger samples
    if (sorted.length > 5) {
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]
      const iqr = q3 - q1
      const lowerBound = q1 - 1.5 * iqr
      const upperBound = q3 + 1.5 * iqr

      const filtered = sorted.filter((v) => v >= lowerBound && v <= upperBound)
      if (filtered.length > 0) {
        const mid = Math.floor(filtered.length / 2)
        return filtered.length % 2 === 0
          ? Math.floor((filtered[mid - 1] + filtered[mid]) / 2)
          : filtered[mid]
      }
    }

    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? Math.floor((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid]
  }

  private formatXAxisTick(timestamp: number): string {
    const date = new Date(timestamp)
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  }
}
