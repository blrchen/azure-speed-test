import { DecimalPipe, DOCUMENT, isPlatformBrowser, Location } from '@angular/common'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'

import { RegionModel } from '../../../models'
import { RegionService } from '../../../services/region.service'
import { SeoService } from '../../../services/seo.service'
import { WidthPercentDirective } from '../../../shared/directives/width-percent.directive'
import { ExportCsvButtonComponent } from '../../../shared/export-csv-button/export-csv-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { RegionGroupComponent } from '../../../shared/region-group/region-group.component'
import {
  buildNormalizedRegionLookup,
  buildRegionDetailHref,
  buildRegionSelectionSignature,
  getSasUrl,
  getSortedRegionIds,
  parseRegionParam,
} from '../../../shared/utils'

const BYTES_PER_MIB = 1024 * 1024
const DOWNLOAD_TEST_FILE_NAME = '100MB.bin'
const DOWNLOAD_SIZE_MIB = 100
const SAS_REQUEST_TIMEOUT_MS = 20_000
const PROGRESS_UPDATE_INTERVAL_MS = 100
const REGIONS_QUERY_PARAM = 'regions'
const LEGACY_SIZE_QUERY_PARAM = 'downloadSize'
const LEAVE_TEST_MESSAGE = 'A download speed test is in progress. Leave this page and cancel it?'

type RegionDownloadStatus =
  'queued' | 'preparing' | 'downloading' | 'completed' | 'failed' | 'cancelled'

interface DownloadSpeedTestResult {
  readonly region: RegionModel
  readonly status: RegionDownloadStatus
  readonly downloadSizeMiB: number
  readonly downloadedBytes: number
  readonly downloadProgressPercentage: number
  readonly downloadTimeSeconds: number
  readonly downloadSpeedMbps: number
  readonly downloadSpeedMiBps: number
  readonly completedAt: number | null
  readonly error?: string
}

type DownloadMetrics = Pick<
  DownloadSpeedTestResult,
  | 'downloadedBytes'
  | 'downloadProgressPercentage'
  | 'downloadTimeSeconds'
  | 'downloadSpeedMbps'
  | 'downloadSpeedMiBps'
>

interface DownloadRunConfiguration {
  readonly regions: readonly RegionModel[]
}

interface DownloadErrorWithStatus {
  readonly status?: number
  readonly statusCode?: number
  readonly name?: string
}

class DownloadPreparationTimeoutError extends Error {
  override readonly name = 'DownloadPreparationTimeoutError'
}

class DownloadHttpError extends Error {
  constructor(readonly statusCode: number) {
    super(`Download request returned HTTP ${statusCode}.`)
    this.name = 'DownloadHttpError'
  }
}

@Component({
  selector: 'app-download',
  imports: [
    DecimalPipe,
    RouterLink,
    RegionGroupComponent,
    LucideIconComponent,
    ExportCsvButtonComponent,
    WidthPercentDirective,
  ],
  templateUrl: './download.component.html',
  host: {
    class: 'block',
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class DownloadComponent implements OnInit {
  private readonly regionService = inject(RegionService)
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)
  private readonly location = inject(Location)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly document = inject(DOCUMENT)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly regionSelectionHeading =
    viewChild<ElementRef<HTMLElement>>('regionSelectionHeading')
  private readonly regionSelector = viewChild(RegionGroupComponent)

  private readonly normalizedRegions = buildNormalizedRegionLookup(
    this.regionService.getAllRegions()
  )
  private abortController: AbortController | null = null
  private destroyed = false
  private lastUrlStateSignature = ''
  private canUpdateUrl = false
  private hasAppliedRouteState = false
  private pendingLegacySizeParamRemoval =
    this.route.snapshot.queryParamMap.has(LEGACY_SIZE_QUERY_PARAM)

  readonly regions = input<string | undefined>()
  readonly downloadSizeMiB = DOWNLOAD_SIZE_MIB
  readonly selectedRegions = this.regionService.selectedRegions
  readonly isRunning = signal(false)
  readonly isCancelling = signal(false)
  readonly selectionError = signal<string | null>(null)
  readonly runError = signal<string | null>(null)
  readonly speedUnit = signal<'mbps' | 'mibps'>('mbps')
  readonly testResults = signal<DownloadSpeedTestResult[]>([])
  private readonly lastRunConfiguration = signal<DownloadRunConfiguration | null>(null)

  readonly finishedRegionCount = computed(
    () => this.testResults().filter((result) => isFinishedStatus(result.status)).length
  )
  readonly resultsNavigationStatus = computed(() => {
    const resultCount = this.testResults().length
    if (resultCount === 0) return null
    if (this.isRunning()) {
      return `${this.finishedRegionCount()} of ${resultCount} finished`
    }
    return `${resultCount} ${resultCount === 1 ? 'result' : 'results'} available`
  })
  readonly overallProgressPercentage = computed(() => {
    const results = this.testResults()
    if (results.length === 0) return 0

    const totalProgress = results.reduce((total, result) => {
      const progress = isFinishedStatus(result.status) ? 100 : result.downloadProgressPercentage
      return total + progress
    }, 0)
    return Math.round(totalProgress / results.length)
  })
  readonly currentResult = computed(
    () =>
      this.testResults().find(
        (result) => result.status === 'preparing' || result.status === 'downloading'
      ) ?? null
  )
  readonly displayResults = computed(() => {
    const results = [...this.testResults()]
    if (this.isRunning()) return results

    return results.sort((left, right) => {
      if (left.status === 'completed' && right.status !== 'completed') return -1
      if (left.status !== 'completed' && right.status === 'completed') return 1
      if (left.status === 'completed' && right.status === 'completed') {
        return right.downloadSpeedMbps - left.downloadSpeedMbps
      }
      return (right.completedAt ?? 0) - (left.completedAt ?? 0)
    })
  })
  readonly bestRegionId = computed(() => {
    const completed = this.testResults().filter((result) => result.status === 'completed')
    if (completed.length < 2) return null
    return completed.reduce((best, candidate) =>
      candidate.downloadSpeedMbps > best.downloadSpeedMbps ? candidate : best
    ).region.regionId
  })
  readonly failedRegionCount = computed(
    () => this.testResults().filter((result) => result.status === 'failed').length
  )
  readonly selectedRegionQueryParams = computed(() => {
    const regionIds = getSortedRegionIds(this.selectedRegions().map((region) => region.regionId))
    return regionIds.length > 0 ? { regions: regionIds.join(',') } : null
  })
  readonly runStatusMessage = computed(() => {
    const results = this.testResults()
    if (results.length === 0) return ''
    const current = this.currentResult()
    if (this.isCancelling()) return 'Cancelling the download speed test.'
    if (current?.status === 'preparing') {
      return `Preparing the download from ${current.region.displayName}.`
    }
    if (current?.status === 'downloading') {
      return `Downloading from ${current.region.displayName}: ${current.downloadProgressPercentage}% complete.`
    }
    if (!this.isRunning()) {
      return `Download speed test finished for ${this.finishedRegionCount()} regions.`
    }
    return ''
  })

  readonly csvHeaders = [
    'Region',
    'Region ID',
    'Datacenter',
    'Status',
    'Download Size (MiB)',
    'Download Time (s)',
    'Download Speed (Mbps)',
    'Download Speed (MiB/s)',
    'Completed At',
    'Error',
  ]
  readonly csvRows = computed<string[][] | null>(() => {
    const results = this.displayResults()
    if (results.length === 0) return null
    return results.map((result) => [
      result.region.displayName,
      result.region.regionId,
      result.region.datacenterLocation,
      getStatusLabel(result.status),
      String(result.downloadSizeMiB),
      result.downloadTimeSeconds.toFixed(2),
      result.downloadSpeedMbps.toFixed(2),
      result.downloadSpeedMiBps.toFixed(2),
      result.completedAt == null ? '' : formatTestTime(result.completedAt),
      result.error ?? '',
    ])
  })

  readonly buildRegionDetailHref = buildRegionDetailHref

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true
      this.abortController?.abort()
    })

    if (this.isBrowser) {
      effect(() => {
        const regions = this.regions()
        untracked(() => this.applyRouteState(regions))
      })
      effect(() => {
        const regionIds = this.selectedRegions().map((region) => region.regionId)
        untracked(() => this.syncUrlWithSelection(regionIds))
      })
    }
  }

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure Multi-Region Download Speed Test',
      description:
        'Download 100 MiB per region and measure Azure Blob Storage throughput with live progress, Mbps, MiB/s, elapsed time, cancellation, and sequential comparisons.',
      canonicalUrl: 'https://www.azurespeed.com/Azure/Download',
    })
  }

  async onSubmit(event?: Event): Promise<void> {
    event?.preventDefault()
    if (this.isRunning()) return

    const regions = this.selectedRegions()
    if (regions.length === 0) {
      this.selectionError.set('Select at least one Azure region before starting the test.')
      this.regionSelectionHeading()?.nativeElement.focus()
      return
    }

    this.selectionError.set(null)
    await this.startTest({ regions: [...regions] })
  }

  cancelTest(): void {
    if (!this.isRunning() || this.isCancelling()) return
    this.isCancelling.set(true)
    this.abortController?.abort()
  }

  async runTestAgain(): Promise<void> {
    const configuration = this.lastRunConfiguration()
    if (!configuration || this.isRunning()) return

    this.regionService.updateSelectedRegions([...configuration.regions])
    await this.startTest(configuration)
  }

  async retryFailedRegions(): Promise<void> {
    if (this.isRunning()) return
    const failedIds = new Set(
      this.testResults()
        .filter((result) => result.status === 'failed')
        .map((result) => result.region.regionId)
    )
    const lastRun = this.lastRunConfiguration()
    if (!lastRun || failedIds.size === 0) return

    const regions = lastRun.regions.filter((region) => failedIds.has(region.regionId))
    await this.startTest({ regions }, { preserveResults: true, updateLastRun: false })
  }

  clearResults(): void {
    if (this.isRunning() || this.testResults().length === 0) return
    if (this.isBrowser && !this.document.defaultView?.confirm('Clear all download test results?')) {
      return
    }
    this.testResults.set([])
    this.runError.set(null)
    this.regionSelector()?.showSelection()
  }

  dismissRunError(): void {
    this.runError.set(null)
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.isRunning()) return
    event.preventDefault()
    event.returnValue = ''
  }

  canDeactivate(): boolean {
    if (!this.isRunning() || !this.isBrowser) return true
    const shouldLeave = this.document.defaultView?.confirm(LEAVE_TEST_MESSAGE) ?? true
    if (shouldLeave) this.abortController?.abort()
    return shouldLeave
  }

  isBestResult(result: DownloadSpeedTestResult): boolean {
    return result.status === 'completed' && this.bestRegionId() === result.region.regionId
  }

  formatDataSize(bytes: number): string {
    return formatDataSize(bytes)
  }

  formatDuration(seconds: number): string {
    return formatDuration(seconds)
  }

  formatTestTime(timestamp: number | null): string {
    return timestamp == null ? '' : formatTestTime(timestamp)
  }

  getStatusLabel(status: RegionDownloadStatus): string {
    return getStatusLabel(status)
  }

  private async startTest(
    configuration: DownloadRunConfiguration,
    options: { preserveResults?: boolean; updateLastRun?: boolean } = {}
  ): Promise<void> {
    if (this.isRunning() || configuration.regions.length === 0) return

    const controller = new AbortController()
    this.abortController = controller
    this.isRunning.set(true)
    this.isCancelling.set(false)
    this.runError.set(null)
    if (options.updateLastRun !== false) this.lastRunConfiguration.set(configuration)

    const queuedResults = configuration.regions.map((region) => this.buildQueuedResult(region))
    if (options.preserveResults) {
      const queuedByRegion = new Map(
        queuedResults.map((result) => [result.region.regionId, result] as const)
      )
      this.testResults.update((results) =>
        results.map((result) => queuedByRegion.get(result.region.regionId) ?? result)
      )
    } else {
      this.testResults.set(queuedResults)
    }
    this.regionSelector()?.viewResults()

    try {
      const totalBytes = DOWNLOAD_SIZE_MIB * BYTES_PER_MIB
      for (const region of configuration.regions) {
        if (controller.signal.aborted) break
        await this.downloadFromAzure(region, totalBytes, controller.signal)
      }
    } catch (error: unknown) {
      if (!this.destroyed) this.runError.set(getDownloadErrorMessage(error, false))
    } finally {
      if (!this.destroyed && controller.signal.aborted) {
        this.testResults.update((results) =>
          results.map((result) =>
            result.status === 'queued'
              ? { ...result, status: 'cancelled', completedAt: Date.now() }
              : result
          )
        )
      }
      if (this.abortController === controller) this.abortController = null
      if (!this.destroyed) {
        this.isRunning.set(false)
        this.isCancelling.set(false)
      }
    }
  }

  private async downloadFromAzure(
    region: RegionModel,
    totalBytes: number,
    abortSignal: AbortSignal
  ): Promise<void> {
    this.updateTestResult(region.regionId, { status: 'preparing' })

    try {
      const sasUrl = await awaitWithAbortAndTimeout(
        getSasUrl(this.http, region.regionId, DOWNLOAD_TEST_FILE_NAME, 'download'),
        abortSignal,
        SAS_REQUEST_TIMEOUT_MS
      )
      throwIfAborted(abortSignal)

      const browserWindow = this.document.defaultView
      if (!browserWindow) throw new Error('Browser download APIs are unavailable.')

      const downloadStartTime = browserWindow.performance.now()
      this.updateTestResult(region.regionId, { status: 'downloading' })
      const response = await browserWindow.fetch(sasUrl, {
        cache: 'no-store',
        credentials: 'omit',
        headers: { Range: `bytes=0-${totalBytes - 1}` },
        mode: 'cors',
        signal: abortSignal,
      })
      if (!response.ok) throw new DownloadHttpError(response.status)
      if (!response.body) throw new Error('The browser did not provide a readable response body.')

      const reader = response.body.getReader()
      let downloadedBytes = 0
      let lastProgressUpdate = downloadStartTime

      try {
        while (downloadedBytes < totalBytes) {
          const { done, value } = await reader.read()
          if (done) break
          throwIfAborted(abortSignal)

          downloadedBytes = Math.min(downloadedBytes + value.byteLength, totalBytes)
          const now = browserWindow.performance.now()
          if (
            now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL_MS ||
            downloadedBytes === totalBytes
          ) {
            this.updateTestResult(region.regionId, {
              ...calculateDownloadMetrics(downloadedBytes, totalBytes, downloadStartTime, now),
              status: 'downloading',
            })
            lastProgressUpdate = now
          }
        }

        if (downloadedBytes >= totalBytes) await reader.cancel()
      } finally {
        reader.releaseLock()
      }

      throwIfAborted(abortSignal)
      if (downloadedBytes < totalBytes) {
        throw new Error('The download ended before the requested test data was received.')
      }

      this.updateTestResult(region.regionId, {
        ...calculateDownloadMetrics(
          totalBytes,
          totalBytes,
          downloadStartTime,
          browserWindow.performance.now()
        ),
        status: 'completed',
        downloadProgressPercentage: 100,
        completedAt: Date.now(),
      })
    } catch (error: unknown) {
      if (abortSignal.aborted || isAbortError(error)) {
        this.updateTestResult(region.regionId, {
          status: 'cancelled',
          completedAt: Date.now(),
        })
        return
      }

      this.updateTestResult(region.regionId, {
        status: 'failed',
        completedAt: Date.now(),
        error: getDownloadErrorMessage(
          error,
          this.isBrowser && this.document.defaultView?.navigator.onLine === false
        ),
      })
    }
  }

  private buildQueuedResult(region: RegionModel): DownloadSpeedTestResult {
    return {
      region,
      status: 'queued',
      downloadSizeMiB: DOWNLOAD_SIZE_MIB,
      downloadedBytes: 0,
      downloadProgressPercentage: 0,
      downloadTimeSeconds: 0,
      downloadSpeedMbps: 0,
      downloadSpeedMiBps: 0,
      completedAt: null,
    }
  }

  private updateTestResult(regionId: string, partial: Partial<DownloadSpeedTestResult>): void {
    this.testResults.update((results) =>
      results.map((result) =>
        result.region.regionId === regionId ? { ...result, ...partial } : result
      )
    )
  }

  private applyRouteState(rawRegions: string | undefined): void {
    if (this.isRunning()) return

    const shouldApplyRegions = typeof rawRegions === 'string' || this.hasAppliedRouteState
    if (shouldApplyRegions) {
      const regions = this.resolveRegionsFromIds(parseRegionParam(rawRegions))
      this.regionService.updateSelectedRegions(regions)
    }

    this.hasAppliedRouteState = true
    this.canUpdateUrl = true
    this.lastUrlStateSignature = buildRegionSelectionSignature(
      this.selectedRegions().map((region) => region.regionId)
    )
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

  private syncUrlWithSelection(regionIds: readonly string[]): void {
    if (!this.isBrowser || !this.canUpdateUrl) return

    const signature = buildRegionSelectionSignature(regionIds)
    if (signature === this.lastUrlStateSignature && !this.pendingLegacySizeParamRemoval) return
    this.lastUrlStateSignature = signature

    const queryParams = { ...this.route.snapshot.queryParams }
    const sortedIds = getSortedRegionIds(regionIds)
    if (sortedIds.length > 0) queryParams[REGIONS_QUERY_PARAM] = sortedIds.join(',')
    else delete queryParams[REGIONS_QUERY_PARAM]

    delete queryParams[LEGACY_SIZE_QUERY_PARAM]
    this.pendingLegacySizeParamRemoval = false

    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams,
    })
    this.location.replaceState(this.router.serializeUrl(urlTree))
  }
}

function calculateDownloadMetrics(
  downloadedBytes: number,
  totalBytes: number,
  downloadStartTime: number,
  currentTime: number
): DownloadMetrics {
  const elapsedSeconds = Math.max((currentTime - downloadStartTime) / 1000, 0.001)
  const bytesPerSecond = downloadedBytes / elapsedSeconds

  return {
    downloadedBytes,
    downloadProgressPercentage: Math.min(Math.round((downloadedBytes / totalBytes) * 100), 100),
    downloadTimeSeconds: Number(elapsedSeconds.toFixed(2)),
    downloadSpeedMbps: Number(((bytesPerSecond * 8) / 1_000_000).toFixed(2)),
    downloadSpeedMiBps: Number((bytesPerSecond / BYTES_PER_MIB).toFixed(2)),
  }
}

function formatDataSize(bytes: number): string {
  const value = bytes / BYTES_PER_MIB
  return `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)} MiB`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} sec`
  return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} sec`
}

function formatTestTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}

function getStatusLabel(status: RegionDownloadStatus): string {
  switch (status) {
    case 'queued':
      return 'Queued'
    case 'preparing':
      return 'Preparing'
    case 'downloading':
      return 'Downloading'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
  }
}

function isFinishedStatus(status: RegionDownloadStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('Download cancelled', 'AbortError')
}

function isAbortError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'AbortError'
  }
  return isDownloadErrorWithStatus(error) && error.name === 'AbortError'
}

function getDownloadErrorMessage(error: unknown, isOffline: boolean): string {
  if (isOffline) return 'You appear to be offline. Reconnect, then try this region again.'
  if (error instanceof DownloadPreparationTimeoutError) {
    return 'Preparing the secure download URL took too long. Try this region again.'
  }

  const status =
    error instanceof HttpErrorResponse
      ? error.status
      : error instanceof DownloadHttpError
        ? error.statusCode
        : isDownloadErrorWithStatus(error)
          ? (error.statusCode ?? error.status)
          : undefined

  if (status === 401 || status === 403) {
    return 'The secure download URL expired or was rejected. Run this region again.'
  }
  if (status === 404) return 'The Azure download test file is unavailable in this region.'
  if (status === 429) return 'Azure is limiting requests right now. Wait, then try again.'
  if (status != null && status >= 500) {
    return 'The Azure download service is unavailable right now. Try again in a moment.'
  }
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'The download service could not be reached. Check your connection and try again.'
  }
  return 'The download did not complete. Check your connection and try this region again.'
}

function isDownloadErrorWithStatus(error: unknown): error is DownloadErrorWithStatus {
  return typeof error === 'object' && error !== null
}

function awaitWithAbortAndTimeout<T>(
  promise: Promise<T>,
  signal: AbortSignal,
  timeoutMs: number
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Download cancelled', 'AbortError'))
      return
    }

    function finish(callback: () => void): void {
      clearTimeout(timeoutId)
      signal.removeEventListener('abort', onAbort)
      callback()
    }
    const timeoutId = setTimeout(
      () => finish(() => reject(new DownloadPreparationTimeoutError())),
      timeoutMs
    )
    const onAbort = () => finish(() => reject(new DOMException('Download cancelled', 'AbortError')))

    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) =>
        finish(() =>
          reject(
            error instanceof Error
              ? error
              : new Error('Preparing the download failed.', { cause: error })
          )
        )
    )
  })
}
