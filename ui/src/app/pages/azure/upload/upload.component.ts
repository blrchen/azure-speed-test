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
import { disabled, form, FormField, submit } from '@angular/forms/signals'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import type { BlockBlobParallelUploadOptions } from '@azure/storage-blob'

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
  generateTimestampedBlobName,
  getSasUrl,
  getSortedRegionIds,
  parseRegionParam,
} from '../../../shared/utils'

const BYTES_PER_MIB = 1024 * 1024
const DEFAULT_UPLOAD_SIZE_MIB = 100
const UPLOAD_SIZE_OPTIONS_MIB = [50, 100, 250, 500] as const
const UPLOAD_BLOCK_SIZE_BYTES = 4 * BYTES_PER_MIB
const UPLOAD_CONCURRENCY = 4
const PAYLOAD_CHUNK_SIZE_BYTES = 4 * BYTES_PER_MIB
const MAX_SINGLE_SHOT_SIZE = 0
const UPLOAD_CONTENT_TYPE = 'application/octet-stream'
const SAS_REQUEST_TIMEOUT_MS = 20_000
const REGIONS_QUERY_PARAM = 'regions'
const SIZE_QUERY_PARAM = 'uploadSize'
const EXCLUDED_REGION_IDS = ['australiacentral'] as const
const EXCLUDED_REGION_ID_LOOKUP = new Set<string>(EXCLUDED_REGION_IDS)
const LEAVE_TEST_MESSAGE = 'An upload speed test is in progress. Leave this page and cancel it?'

type RegionUploadStatus =
  'queued' | 'preparing' | 'uploading' | 'completed' | 'failed' | 'cancelled'

interface UploadSpeedTestResult {
  readonly region: RegionModel
  readonly status: RegionUploadStatus
  readonly uploadSizeMiB: number
  readonly uploadedBytes: number
  readonly uploadProgressPercentage: number
  readonly uploadTimeSeconds: number
  readonly uploadSpeedMbps: number
  readonly uploadSpeedMiBps: number
  readonly completedAt: number | null
  readonly error?: string
}

type UploadMetrics = Pick<
  UploadSpeedTestResult,
  | 'uploadedBytes'
  | 'uploadProgressPercentage'
  | 'uploadTimeSeconds'
  | 'uploadSpeedMbps'
  | 'uploadSpeedMiBps'
>

interface UploadRunConfiguration {
  readonly regions: readonly RegionModel[]
  readonly uploadSizeMiB: number
}

interface UploadErrorWithStatus {
  readonly status?: number
  readonly statusCode?: number
  readonly code?: string
  readonly name?: string
}

class UploadPreparationTimeoutError extends Error {
  override readonly name = 'UploadPreparationTimeoutError'
}

class UploadRequestError extends Error implements UploadErrorWithStatus {
  readonly statusCode?: number
  readonly code?: string

  constructor(error: unknown) {
    super('Upload request failed', { cause: error })
    this.name = 'UploadRequestError'
    if (isUploadErrorWithStatus(error)) {
      this.statusCode = error.statusCode ?? error.status
      this.code = error.code
    }
  }
}

@Component({
  selector: 'app-upload',
  imports: [
    DecimalPipe,
    FormField,
    RouterLink,
    RegionGroupComponent,
    LucideIconComponent,
    ExportCsvButtonComponent,
    WidthPercentDirective,
  ],
  templateUrl: './upload.component.html',
  host: {
    class: 'block',
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class UploadComponent implements OnInit {
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

  private readonly allowedRegions = this.regionService
    .getAllRegions()
    .filter((region) => !EXCLUDED_REGION_ID_LOOKUP.has(region.regionId))
  private readonly allowedRegionIds = new Set(this.allowedRegions.map((region) => region.regionId))
  private readonly normalizedRegions = buildNormalizedRegionLookup(this.allowedRegions)
  private abortController: AbortController | null = null
  private destroyed = false
  private lastUrlStateSignature = ''
  private canUpdateUrl = false
  private hasAppliedRouteState = false

  readonly regions = input<string | undefined>()
  readonly uploadSize = input<string | undefined>()
  readonly uploadSizeMiBOptions = UPLOAD_SIZE_OPTIONS_MIB
  readonly excludedRegionIds = EXCLUDED_REGION_IDS
  readonly selectedRegions = computed(() =>
    this.regionService
      .selectedRegions()
      .filter((region) => this.allowedRegionIds.has(region.regionId))
  )
  readonly uploadSizeModel = signal({ uploadSizeMiB: String(DEFAULT_UPLOAD_SIZE_MIB) })
  readonly isRunning = signal(false)
  readonly isCancelling = signal(false)
  readonly selectionError = signal<string | null>(null)
  readonly runError = signal<string | null>(null)
  readonly speedUnit = signal<'mbps' | 'mibps'>('mbps')
  readonly testResults = signal<UploadSpeedTestResult[]>([])
  private readonly lastRunConfiguration = signal<UploadRunConfiguration | null>(null)

  readonly uploadSizeForm = form(
    this.uploadSizeModel,
    (path) => {
      disabled(path.uploadSizeMiB, { when: () => this.isRunning() })
    },
    { name: 'uploadSize' }
  )
  readonly selectedUploadSizeMiB = computed(
    () => Number(this.uploadSizeModel().uploadSizeMiB) || DEFAULT_UPLOAD_SIZE_MIB
  )
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
      const progress = isFinishedStatus(result.status) ? 100 : result.uploadProgressPercentage
      return total + progress
    }, 0)
    return Math.round(totalProgress / results.length)
  })
  readonly currentResult = computed(
    () =>
      this.testResults().find(
        (result) => result.status === 'preparing' || result.status === 'uploading'
      ) ?? null
  )
  readonly displayResults = computed(() => {
    const results = [...this.testResults()]
    if (this.isRunning()) return results

    return results.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return -1
      if (a.status !== 'completed' && b.status === 'completed') return 1
      if (a.status === 'completed' && b.status === 'completed') {
        return b.uploadSpeedMbps - a.uploadSpeedMbps
      }
      return (b.completedAt ?? 0) - (a.completedAt ?? 0)
    })
  })
  readonly bestRegionId = computed(() => {
    const completed = this.testResults().filter((result) => result.status === 'completed')
    if (completed.length < 2) return null
    return completed.reduce((best, candidate) =>
      candidate.uploadSpeedMbps > best.uploadSpeedMbps ? candidate : best
    ).region.regionId
  })
  readonly failedRegionCount = computed(
    () => this.testResults().filter((result) => result.status === 'failed').length
  )
  readonly runStatusMessage = computed(() => {
    const results = this.testResults()
    if (results.length === 0) return ''
    const current = this.currentResult()
    if (this.isCancelling()) return 'Cancelling the upload speed test.'
    if (current?.status === 'preparing') {
      return `Preparing the upload to ${current.region.displayName}.`
    }
    if (current?.status === 'uploading') {
      return `Uploading to ${current.region.displayName}: ${current.uploadProgressPercentage}% complete.`
    }
    if (!this.isRunning()) {
      return `Upload speed test finished for ${this.finishedRegionCount()} regions.`
    }
    return ''
  })

  readonly csvHeaders = [
    'Region',
    'Region ID',
    'Datacenter',
    'Status',
    'Upload Size (MiB)',
    'Upload Time (s)',
    'Upload Speed (Mbps)',
    'Upload Speed (MiB/s)',
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
      String(result.uploadSizeMiB),
      result.uploadTimeSeconds.toFixed(2),
      result.uploadSpeedMbps.toFixed(2),
      result.uploadSpeedMiBps.toFixed(2),
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
        const size = this.uploadSize()
        untracked(() => this.applyRouteState(regions, size))
      })
      effect(() => {
        const regionIds = this.selectedRegions().map((region) => region.regionId)
        const size = this.selectedUploadSizeMiB()
        untracked(() => this.syncUrlWithSelection(regionIds, size))
      })
    }
  }

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure Multi-Region Upload Speed Test',
      description:
        'Generate synthetic browser test data and measure sequential upload throughput to selected Azure Blob Storage regions.',
      canonicalUrl: 'https://www.azurespeed.com/Azure/Upload',
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
    await submit(this.uploadSizeForm, async () => {
      await this.startTest({
        regions: [...regions],
        uploadSizeMiB: this.selectedUploadSizeMiB(),
      })
      return undefined
    })
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
    this.uploadSizeModel.set({ uploadSizeMiB: String(configuration.uploadSizeMiB) })
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
    await this.startTest(
      { regions, uploadSizeMiB: lastRun.uploadSizeMiB },
      { preserveResults: true, updateLastRun: false }
    )
  }

  clearResults(): void {
    if (this.isRunning() || this.testResults().length === 0) return
    if (this.isBrowser && !this.document.defaultView?.confirm('Clear all upload test results?')) {
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

  isBestResult(result: UploadSpeedTestResult): boolean {
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

  getStatusLabel(status: RegionUploadStatus): string {
    return getStatusLabel(status)
  }

  private async startTest(
    configuration: UploadRunConfiguration,
    options: { preserveResults?: boolean; updateLastRun?: boolean } = {}
  ): Promise<void> {
    if (this.isRunning() || configuration.regions.length === 0) return

    const controller = new AbortController()
    this.abortController = controller
    this.isRunning.set(true)
    this.isCancelling.set(false)
    this.runError.set(null)
    if (options.updateLastRun !== false) this.lastRunConfiguration.set(configuration)
    const queuedResults = configuration.regions.map((region) =>
      this.buildQueuedResult(region, configuration)
    )
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
      const totalBytes = configuration.uploadSizeMiB * BYTES_PER_MIB
      const uploadPayload = createMemoryEfficientPayload(totalBytes)

      for (const region of configuration.regions) {
        if (controller.signal.aborted) break
        await this.uploadToAzure(region, uploadPayload, totalBytes, controller.signal)
      }
    } catch (error: unknown) {
      if (!this.destroyed) this.runError.set(getUploadErrorMessage(error, false))
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

  private async uploadToAzure(
    region: RegionModel,
    uploadPayload: Blob,
    totalBytes: number,
    abortSignal: AbortSignal
  ): Promise<void> {
    this.updateTestResult(region.regionId, { status: 'preparing' })

    try {
      const [sasUrl, { BlockBlobClient }] = await Promise.all([
        awaitWithAbortAndTimeout(
          getSasUrl(this.http, region.regionId, generateTimestampedBlobName()),
          abortSignal,
          SAS_REQUEST_TIMEOUT_MS
        ),
        import('@azure/storage-blob'),
      ])
      throwIfAborted(abortSignal)

      const blockBlobClient = new BlockBlobClient(sasUrl)
      const uploadStartTime = Date.now()
      this.updateTestResult(region.regionId, { status: 'uploading' })
      const options: BlockBlobParallelUploadOptions = {
        blockSize: UPLOAD_BLOCK_SIZE_BYTES,
        concurrency: UPLOAD_CONCURRENCY,
        maxSingleShotSize: MAX_SINGLE_SHOT_SIZE,
        abortSignal,
        onProgress: ({ loadedBytes }) => {
          if (abortSignal.aborted) return
          this.updateTestResult(region.regionId, {
            ...calculateUploadMetrics(loadedBytes, totalBytes, uploadStartTime),
            status: 'uploading',
          })
        },
      }

      await blockBlobClient.uploadData(uploadPayload, options)
      throwIfAborted(abortSignal)
      this.updateTestResult(region.regionId, {
        ...calculateUploadMetrics(totalBytes, totalBytes, uploadStartTime),
        status: 'completed',
        uploadProgressPercentage: 100,
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
        error: getUploadErrorMessage(
          error,
          this.isBrowser && this.document.defaultView?.navigator.onLine === false
        ),
      })
    }
  }

  private buildQueuedResult(
    region: RegionModel,
    configuration: UploadRunConfiguration
  ): UploadSpeedTestResult {
    return {
      region,
      status: 'queued',
      uploadSizeMiB: configuration.uploadSizeMiB,
      uploadedBytes: 0,
      uploadProgressPercentage: 0,
      uploadTimeSeconds: 0,
      uploadSpeedMbps: 0,
      uploadSpeedMiBps: 0,
      completedAt: null,
    }
  }

  private updateTestResult(regionId: string, partial: Partial<UploadSpeedTestResult>): void {
    this.testResults.update((results) =>
      results.map((result) =>
        result.region.regionId === regionId ? { ...result, ...partial } : result
      )
    )
  }

  private applyRouteState(rawRegions: string | undefined, rawSize: string | undefined): void {
    if (this.isRunning()) return

    const shouldApplyRegions = typeof rawRegions === 'string' || this.hasAppliedRouteState
    if (shouldApplyRegions) {
      const regions = this.resolveRegionsFromIds(parseRegionParam(rawRegions))
      this.regionService.updateSelectedRegions(regions)
    }

    const shouldApplySize = typeof rawSize === 'string' || this.hasAppliedRouteState
    if (shouldApplySize) {
      const parsedSize = Number(rawSize)
      const uploadSizeMiB = UPLOAD_SIZE_OPTIONS_MIB.includes(parsedSize as never)
        ? parsedSize
        : DEFAULT_UPLOAD_SIZE_MIB
      this.uploadSizeModel.set({ uploadSizeMiB: String(uploadSizeMiB) })
    }

    this.hasAppliedRouteState = true
    this.canUpdateUrl = true
    this.lastUrlStateSignature = this.buildUrlStateSignature(
      this.selectedRegions().map((region) => region.regionId),
      this.selectedUploadSizeMiB()
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

  private syncUrlWithSelection(regionIds: readonly string[], uploadSizeMiB: number): void {
    if (!this.isBrowser || !this.canUpdateUrl) return

    const signature = this.buildUrlStateSignature(regionIds, uploadSizeMiB)
    if (signature === this.lastUrlStateSignature) return
    this.lastUrlStateSignature = signature

    const queryParams = { ...this.route.snapshot.queryParams }
    const sortedIds = getSortedRegionIds(regionIds)
    if (sortedIds.length > 0) queryParams[REGIONS_QUERY_PARAM] = sortedIds.join(',')
    else delete queryParams[REGIONS_QUERY_PARAM]

    if (uploadSizeMiB === DEFAULT_UPLOAD_SIZE_MIB) delete queryParams[SIZE_QUERY_PARAM]
    else queryParams[SIZE_QUERY_PARAM] = uploadSizeMiB

    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams,
    })
    this.location.replaceState(this.router.serializeUrl(urlTree))
  }

  private buildUrlStateSignature(regionIds: readonly string[], uploadSizeMiB: number): string {
    return `${buildRegionSelectionSignature(regionIds)}|${uploadSizeMiB}`
  }
}

function createMemoryEfficientPayload(totalBytes: number): Blob {
  const chunkSize = Math.min(PAYLOAD_CHUNK_SIZE_BYTES, totalBytes)
  const zeroChunk = new Blob([new Uint8Array(chunkSize)], { type: UPLOAD_CONTENT_TYPE })
  const fullChunkCount = Math.floor(totalBytes / chunkSize)
  const remainder = totalBytes % chunkSize
  const parts: Blob[] = Array.from({ length: fullChunkCount }, () => zeroChunk)
  if (remainder > 0) parts.push(zeroChunk.slice(0, remainder))
  return new Blob(parts, { type: UPLOAD_CONTENT_TYPE })
}

function calculateUploadMetrics(
  loadedBytes: number,
  totalBytes: number,
  uploadStartTime: number
): UploadMetrics {
  const elapsedSeconds = Math.max((Date.now() - uploadStartTime) / 1000, 0.001)
  const bytesPerSecond = loadedBytes / elapsedSeconds

  return {
    uploadedBytes: loadedBytes,
    uploadProgressPercentage: Math.min(Math.round((loadedBytes / totalBytes) * 100), 100),
    uploadTimeSeconds: Number(elapsedSeconds.toFixed(2)),
    uploadSpeedMbps: Number(((bytesPerSecond * 8) / 1_000_000).toFixed(2)),
    uploadSpeedMiBps: Number((bytesPerSecond / BYTES_PER_MIB).toFixed(2)),
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

function getStatusLabel(status: RegionUploadStatus): string {
  switch (status) {
    case 'queued':
      return 'Queued'
    case 'preparing':
      return 'Preparing'
    case 'uploading':
      return 'Uploading'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
  }
}

function isFinishedStatus(status: RegionUploadStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('Upload cancelled', 'AbortError')
}

function isAbortError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'AbortError'
  }
  return isUploadErrorWithStatus(error) && error.name === 'AbortError'
}

function getUploadErrorMessage(error: unknown, isOffline: boolean): string {
  if (isOffline) return 'You appear to be offline. Reconnect, then try this region again.'
  if (error instanceof UploadPreparationTimeoutError) {
    return 'Preparing the secure upload URL took too long. Try this region again.'
  }

  const status =
    error instanceof HttpErrorResponse
      ? error.status
      : isUploadErrorWithStatus(error)
        ? (error.statusCode ?? error.status)
        : undefined
  const code = isUploadErrorWithStatus(error) ? error.code : undefined

  if (status === 401 || status === 403 || code === 'AuthenticationFailed') {
    return 'The secure upload URL expired or was rejected. Try a smaller test size or run it again.'
  }
  if (status === 429) return 'Azure is limiting requests right now. Wait, then try again.'
  if (status != null && status >= 500) {
    return 'The Azure upload service is unavailable right now. Try again in a moment.'
  }
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'The upload service could not be reached. Check your connection and try again.'
  }
  return 'The upload did not complete. Check your connection and try this region again.'
}

function isUploadErrorWithStatus(error: unknown): error is UploadErrorWithStatus {
  return typeof error === 'object' && error !== null
}

function awaitWithAbortAndTimeout<T>(
  promise: Promise<T>,
  signal: AbortSignal,
  timeoutMs: number
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Upload cancelled', 'AbortError'))
      return
    }

    function finish(callback: () => void): void {
      clearTimeout(timeoutId)
      signal.removeEventListener('abort', onAbort)
      callback()
    }
    const timeoutId = setTimeout(
      () => finish(() => reject(new UploadPreparationTimeoutError())),
      timeoutMs
    )
    const onAbort = () => finish(() => reject(new DOMException('Upload cancelled', 'AbortError')))

    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) =>
        finish(() => reject(error instanceof Error ? error : new UploadRequestError(error)))
    )
  })
}
