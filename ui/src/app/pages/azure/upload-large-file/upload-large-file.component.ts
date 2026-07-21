import { DecimalPipe, DOCUMENT, isPlatformBrowser } from '@angular/common'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core'
import { disabled, form, FormField, required, submit, validate } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import type { BlockBlobParallelUploadOptions } from '@azure/storage-blob'

import { RegionModel } from '../../../models'
import { RegionService } from '../../../services/region.service'
import { SeoService } from '../../../services/seo.service'
import { WidthPercentDirective } from '../../../shared/directives/width-percent.directive'
import { ExportCsvButtonComponent } from '../../../shared/export-csv-button/export-csv-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import {
  buildRegionDetailHref,
  generateTimestampedBlobName,
  getSasUrl,
  REGION_NAME_COLLATOR,
} from '../../../shared/utils'

const BYTES_PER_KIB = 1024
const BYTES_PER_MIB = BYTES_PER_KIB * BYTES_PER_KIB
const BYTES_PER_GIB = BYTES_PER_MIB * BYTES_PER_KIB
const MIN_FILE_SIZE_BYTES = BYTES_PER_MIB
const MAX_FILE_SIZE_BYTES = 5 * BYTES_PER_GIB
const MAX_SINGLE_SHOT_SIZE = 0
const SAS_REQUEST_TIMEOUT_MS = 20_000
const EXCLUDED_REGION_IDS = new Set(['australiacentral'])
const LEAVE_UPLOAD_MESSAGE = 'An upload is in progress. Leave this page and cancel the test?'

const BLOCK_SIZE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '4096', label: '4 MiB' },
  { value: '8192', label: '8 MiB' },
  { value: '16384', label: '16 MiB' },
  { value: '32768', label: '32 MiB' },
] as const

const CONCURRENCY_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '4', label: '4' },
  { value: '8', label: '8' },
  { value: '16', label: '16' },
] as const

type UploadStatus = 'preparing' | 'uploading' | 'cancelling' | 'completed' | 'failed' | 'cancelled'
type FinalUploadStatus = Extract<UploadStatus, 'completed' | 'failed' | 'cancelled'>
type ResultSort = 'fastest' | 'newest'

interface UploadConfiguration {
  readonly file: File
  readonly region: RegionModel
  readonly requestedBlockSize: string
  readonly requestedConcurrency: string
  readonly blockSizeKiB: number
  readonly concurrency: number
}

interface UploadTask extends UploadConfiguration {
  readonly id: string
  readonly status: UploadStatus
  readonly startedAt: number
  readonly uploadedBytes: number
  readonly progressPercentage: number
  readonly uploadTimeSeconds: number
  readonly uploadSpeedMbps: number
  readonly uploadSpeedMiBps: number
  readonly estimatedSecondsRemaining: number | null
  readonly error?: string
}

interface LargeFileUploadTestResult extends UploadTask {
  readonly status: FinalUploadStatus
  readonly completedAt: number
}

interface UploadMetrics {
  readonly uploadedBytes: number
  readonly progressPercentage: number
  readonly uploadTimeSeconds: number
  readonly uploadSpeedMbps: number
  readonly uploadSpeedMiBps: number
  readonly estimatedSecondsRemaining: number | null
}

interface UploadErrorWithStatus {
  readonly statusCode?: number
  readonly code?: string
  readonly name?: string
}

class UploadPreparationTimeoutError extends Error {
  override readonly name = 'UploadPreparationTimeoutError'
}

@Component({
  selector: 'app-upload-large-file',
  imports: [
    DecimalPipe,
    FormField,
    RouterLink,
    ExportCsvButtonComponent,
    LucideIconComponent,
    WidthPercentDirective,
  ],
  templateUrl: './upload-large-file.component.html',
  host: {
    class: 'block',
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class UploadLargeFileComponent implements OnInit {
  private readonly regionService = inject(RegionService)
  private readonly seoService = inject(SeoService)
  private readonly httpClient = inject(HttpClient)
  private readonly document = inject(DOCUMENT)
  private readonly destroyRef = inject(DestroyRef)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))

  private readonly regionSelect = viewChild<ElementRef<HTMLSelectElement>>('regionSelect')
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput')
  private abortController: AbortController | null = null
  private destroyed = false

  readonly regions: readonly RegionModel[] = Object.freeze(
    this.regionService
      .getAllRegions()
      .filter((region) => !EXCLUDED_REGION_IDS.has(region.regionId.toLowerCase()))
      .sort((a, b) => REGION_NAME_COLLATOR.compare(a.displayName, b.displayName))
  )
  readonly blockSizeOptions = BLOCK_SIZE_OPTIONS
  readonly concurrencyOptions = CONCURRENCY_OPTIONS
  readonly selectedFile = signal<File | null>(null)
  readonly isFileDragActive = signal(false)
  readonly currentUpload = signal<UploadTask | null>(null)
  readonly testResults = signal<LargeFileUploadTestResult[]>([])
  readonly uploadError = signal<string | null>(null)
  readonly speedUnit = signal<'mbps' | 'mibps'>('mbps')
  readonly resultSort = signal<ResultSort>('fastest')
  private readonly lastUploadConfiguration = signal<UploadConfiguration | null>(null)

  readonly isUploadActive = computed(() => {
    const status = this.currentUpload()?.status
    return status === 'preparing' || status === 'uploading' || status === 'cancelling'
  })

  readonly uploadModel = signal({
    region: '',
    fileName: '',
    blockSizeKiB: 'auto',
    concurrency: 'auto',
  })
  readonly uploadForm = form(
    this.uploadModel,
    (path) => {
      required(path.region, { message: 'Select an Azure region.' })
      required(path.fileName, { message: 'Select a test file.' })
      validate(path.fileName, () => {
        const message = getFileValidationMessage(this.selectedFile())
        return message ? { kind: 'fileSize', message } : undefined
      })
      required(path.blockSizeKiB)
      required(path.concurrency)
      disabled(path.region, { when: () => this.isUploadActive() })
      disabled(path.blockSizeKiB, { when: () => this.isUploadActive() })
      disabled(path.concurrency, { when: () => this.isUploadActive() })
    },
    { name: 'largeFileUpload' }
  )

  readonly selectedRegion = computed(() => {
    const regionId = this.uploadModel().region
    return this.regions.find((region) => region.regionId === regionId) ?? null
  })
  readonly selectedFileSizeLabel = computed(() => {
    const file = this.selectedFile()
    return file ? formatDataSize(file.size) : ''
  })
  readonly selectedFileTypeLabel = computed(() => getFileTypeLabel(this.selectedFile()))
  readonly regionErrorMessage = computed(() => getFirstFieldError(this.uploadForm.region()))
  readonly fileErrorMessage = computed(() => getFirstFieldError(this.uploadForm.fileName()))
  readonly uploadStatusMessage = computed(() => {
    const task = this.currentUpload()
    if (!task) return ''

    switch (task.status) {
      case 'preparing':
        return `Preparing the upload to ${task.region.displayName}.`
      case 'uploading':
        return `Uploading ${task.file.name}: ${task.progressPercentage}% complete.`
      case 'cancelling':
        return 'Cancelling the upload.'
      case 'completed':
        return `Upload complete at ${task.uploadSpeedMbps.toFixed(2)} Mbps.`
      case 'failed':
        return task.error ?? 'Upload failed.'
      case 'cancelled':
        return 'Upload cancelled.'
    }
  })
  readonly sortedResults = computed(() => {
    const results = [...this.testResults()]
    if (this.resultSort() === 'newest') {
      return results.sort((a, b) => b.completedAt - a.completedAt)
    }

    return results.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return -1
      if (a.status !== 'completed' && b.status === 'completed') return 1
      if (a.status === 'completed' && b.status === 'completed') {
        return b.uploadSpeedMbps - a.uploadSpeedMbps
      }
      return b.completedAt - a.completedAt
    })
  })
  readonly bestResultIds = computed(() => {
    const comparableGroups = new Map<string, LargeFileUploadTestResult[]>()
    for (const result of this.testResults()) {
      if (result.status !== 'completed') continue
      const key = getComparisonKey(result)
      const group = comparableGroups.get(key)
      if (group) group.push(result)
      else comparableGroups.set(key, [result])
    }

    const bestIds = new Set<string>()
    for (const group of comparableGroups.values()) {
      if (group.length < 2) continue
      const best = group.reduce((current, candidate) =>
        candidate.uploadSpeedMbps > current.uploadSpeedMbps ? candidate : current
      )
      bestIds.add(best.id)
    }
    return bestIds
  })

  readonly csvHeaders = [
    'Tested At',
    'File',
    'Size (MiB)',
    'Region',
    'Region ID',
    'Datacenter',
    'Block Size (MiB)',
    'Concurrency',
    'Status',
    'Upload Time (s)',
    'Upload Speed (Mbps)',
    'Upload Speed (MiB/s)',
    'Error',
  ]
  readonly csvRows = computed<string[][] | null>(() => {
    const results = this.sortedResults()
    if (results.length === 0) return null

    return results.map((result) => [
      formatTestTime(result.completedAt),
      result.file.name,
      (result.file.size / BYTES_PER_MIB).toFixed(2),
      result.region.displayName,
      result.region.regionId,
      result.region.datacenterLocation,
      (result.blockSizeKiB / BYTES_PER_KIB).toFixed(0),
      String(result.concurrency),
      getStatusLabel(result.status),
      result.uploadTimeSeconds.toFixed(2),
      result.uploadSpeedMbps.toFixed(2),
      result.uploadSpeedMiBps.toFixed(2),
      result.error ?? '',
    ])
  })

  readonly buildRegionDetailHref = buildRegionDetailHref

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true
      this.abortController?.abort()
    })
  }

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure Large File Upload Speed Test',
      description:
        'Upload a local test file directly from your browser to Azure Blob Storage, choose an Azure region, and measure transfer time and throughput.',
      canonicalUrl: 'https://www.azurespeed.com/Azure/UploadLargeFile',
    })
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement
    this.setSelectedFile(input.files?.item(0) ?? null)
  }

  onFileDragOver(event: DragEvent): void {
    event.preventDefault()
    if (this.isUploadActive()) return
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    this.isFileDragActive.set(true)
  }

  onFileDragLeave(event: DragEvent): void {
    event.preventDefault()
    this.isFileDragActive.set(false)
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault()
    this.isFileDragActive.set(false)
    if (this.isUploadActive()) return
    this.setSelectedFile(event.dataTransfer?.files.item(0) ?? null)
  }

  openFilePicker(): void {
    if (!this.isUploadActive()) this.fileInput()?.nativeElement.click()
  }

  removeSelectedFile(): void {
    if (this.isUploadActive()) return
    this.setSelectedFile(null)
    const input = this.fileInput()?.nativeElement
    if (input) input.value = ''
  }

  async onSubmit(event?: Event): Promise<void> {
    event?.preventDefault()
    if (this.isUploadActive()) return

    await submit(this.uploadForm, async () => {
      const file = this.selectedFile()
      const region = this.selectedRegion()
      if (!file || !region) return undefined

      await this.startUpload(
        this.createUploadConfiguration(
          file,
          region,
          this.uploadModel().blockSizeKiB,
          this.uploadModel().concurrency
        )
      )
      return undefined
    })

    if (this.uploadForm().invalid()) this.focusFirstInvalidField()
  }

  cancelUpload(): void {
    if (!this.isUploadActive()) return
    const task = this.currentUpload()
    if (task) this.currentUpload.set({ ...task, status: 'cancelling' })
    this.abortController?.abort()
  }

  async retryLastUpload(): Promise<void> {
    const configuration = this.lastUploadConfiguration()
    if (!configuration || this.isUploadActive()) return
    this.restoreConfiguration(configuration)
    await this.startUpload(configuration)
  }

  async runAgain(source: UploadConfiguration): Promise<void> {
    if (this.isUploadActive()) return
    const configuration: UploadConfiguration = {
      file: source.file,
      region: source.region,
      requestedBlockSize: source.requestedBlockSize,
      requestedConcurrency: source.requestedConcurrency,
      blockSizeKiB: source.blockSizeKiB,
      concurrency: source.concurrency,
    }
    this.restoreConfiguration(configuration)
    await this.startUpload(configuration)
  }

  clearResults(): void {
    if (this.testResults().length === 0 || this.isUploadActive()) return
    if (this.isBrowser && !this.document.defaultView?.confirm('Clear all upload test results?')) {
      return
    }
    this.testResults.set([])
    const task = this.currentUpload()
    if (task && isFinalStatus(task.status)) this.currentUpload.set(null)
  }

  dismissError(): void {
    this.uploadError.set(null)
  }

  onResultSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value
    if (value === 'fastest' || value === 'newest') this.resultSort.set(value)
  }

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.isUploadActive()) return
    event.preventDefault()
    event.returnValue = ''
  }

  canDeactivate(): boolean {
    if (!this.isUploadActive() || !this.isBrowser) return true
    const shouldLeave = this.document.defaultView?.confirm(LEAVE_UPLOAD_MESSAGE) ?? true
    if (shouldLeave) this.abortController?.abort()
    return shouldLeave
  }

  isBestResult(id: string): boolean {
    return this.bestResultIds().has(id)
  }

  formatDataSize(bytes: number): string {
    return formatDataSize(bytes)
  }

  formatDuration(seconds: number): string {
    return formatDuration(seconds)
  }

  formatRemainingTime(seconds: number | null): string {
    if (seconds == null || !Number.isFinite(seconds)) return 'Estimating...'
    if (seconds < 60) return `${Math.max(1, Math.ceil(seconds))} sec`
    return `${Math.ceil(seconds / 60)} min`
  }

  formatTestTime(timestamp: number): string {
    return formatTestTime(timestamp)
  }

  getStatusLabel(status: FinalUploadStatus): string {
    return getStatusLabel(status)
  }

  private setSelectedFile(file: File | null): void {
    this.selectedFile.set(file)
    this.uploadModel.update((model) => ({ ...model, fileName: file?.name ?? '' }))
    this.uploadForm.fileName().markAsTouched()
    this.uploadError.set(null)
  }

  private focusFirstInvalidField(): void {
    if (this.uploadForm.region().invalid()) {
      this.regionSelect()?.nativeElement.focus()
      return
    }
    if (this.uploadForm.fileName().invalid()) this.fileInput()?.nativeElement.focus()
  }

  private createUploadConfiguration(
    file: File,
    region: RegionModel,
    requestedBlockSize: string,
    requestedConcurrency: string
  ): UploadConfiguration {
    return {
      file,
      region,
      requestedBlockSize,
      requestedConcurrency,
      blockSizeKiB: resolveBlockSizeKiB(requestedBlockSize, file.size),
      concurrency: resolveConcurrency(requestedConcurrency, file.size),
    }
  }

  private restoreConfiguration(configuration: UploadConfiguration): void {
    this.selectedFile.set(configuration.file)
    this.uploadModel.set({
      region: configuration.region.regionId,
      fileName: configuration.file.name,
      blockSizeKiB: configuration.requestedBlockSize,
      concurrency: configuration.requestedConcurrency,
    })
    this.uploadForm().reset()
    this.uploadError.set(null)
  }

  private async startUpload(configuration: UploadConfiguration): Promise<void> {
    if (this.isUploadActive()) return

    const id = generateTimestampedBlobName()
    const controller = new AbortController()
    const startedAt = Date.now()
    const task: UploadTask = {
      ...configuration,
      id,
      status: 'preparing',
      startedAt,
      uploadedBytes: 0,
      progressPercentage: 0,
      uploadTimeSeconds: 0,
      uploadSpeedMbps: 0,
      uploadSpeedMiBps: 0,
      estimatedSecondsRemaining: null,
    }

    this.abortController = controller
    this.lastUploadConfiguration.set(configuration)
    this.currentUpload.set(task)
    this.uploadError.set(null)

    try {
      const [sasUrl, { BlockBlobClient }] = await Promise.all([
        awaitWithAbortAndTimeout(
          getSasUrl(this.httpClient, configuration.region.regionId, id),
          controller.signal,
          SAS_REQUEST_TIMEOUT_MS
        ),
        import('@azure/storage-blob'),
      ])
      throwIfAborted(controller.signal)

      const blockBlobClient = new BlockBlobClient(sasUrl)
      const uploadStartTime = Date.now()
      this.updateCurrentUpload(id, { status: 'uploading' })

      const options: BlockBlobParallelUploadOptions = {
        blockSize: configuration.blockSizeKiB * BYTES_PER_KIB,
        concurrency: configuration.concurrency,
        maxSingleShotSize: MAX_SINGLE_SHOT_SIZE,
        abortSignal: controller.signal,
        onProgress: ({ loadedBytes }) => {
          if (controller.signal.aborted) return
          this.updateCurrentUpload(
            id,
            calculateUploadMetrics(loadedBytes, configuration.file.size, uploadStartTime)
          )
        },
      }

      await blockBlobClient.uploadData(configuration.file, options)
      throwIfAborted(controller.signal)
      this.finalizeUpload(
        id,
        'completed',
        calculateUploadMetrics(configuration.file.size, configuration.file.size, uploadStartTime)
      )
    } catch (error: unknown) {
      if (this.destroyed) return
      if (controller.signal.aborted || isAbortError(error)) {
        this.finalizeUpload(id, 'cancelled')
      } else {
        const message = getUploadErrorMessage(
          error,
          this.isBrowser && this.document.defaultView?.navigator.onLine === false
        )
        this.uploadError.set(message)
        this.finalizeUpload(id, 'failed', undefined, message)
      }
    } finally {
      if (this.abortController === controller) this.abortController = null
    }
  }

  private updateCurrentUpload(id: string, partial: Partial<UploadTask>): void {
    const task = this.currentUpload()
    if (!task || task.id !== id) return
    this.currentUpload.set({ ...task, ...partial })
  }

  private finalizeUpload(
    id: string,
    status: FinalUploadStatus,
    metrics?: UploadMetrics,
    error?: string
  ): void {
    const task = this.currentUpload()
    if (!task || task.id !== id) return

    const result: LargeFileUploadTestResult = {
      ...task,
      ...metrics,
      status,
      completedAt: Date.now(),
      ...(error ? { error } : {}),
    }
    this.currentUpload.set(result)
    this.testResults.update((results) => [result, ...results])
  }
}

function getFirstFieldError(fieldState: {
  touched(): boolean
  errors(): readonly { readonly message?: string }[]
}): string | null {
  if (!fieldState.touched()) return null
  return fieldState.errors()[0]?.message ?? null
}

function getFileValidationMessage(file: File | null): string | null {
  if (!file) return null
  if (file.size === 0) return 'Choose a file that is not empty.'
  if (file.size < MIN_FILE_SIZE_BYTES) return 'Choose a file of at least 1 MiB.'
  if (file.size > MAX_FILE_SIZE_BYTES) return 'Choose a file no larger than 5 GiB.'
  return null
}

function getFileTypeLabel(file: File | null): string {
  if (file == null || file.type.length === 0) return 'Unknown file type'
  return file.type
}

function resolveBlockSizeKiB(value: string, fileSize: number): number {
  if (value !== 'auto') return Number(value)
  if (fileSize >= 4 * BYTES_PER_GIB) return 32 * BYTES_PER_KIB
  if (fileSize >= BYTES_PER_GIB) return 16 * BYTES_PER_KIB
  if (fileSize >= 256 * BYTES_PER_MIB) return 8 * BYTES_PER_KIB
  return 4 * BYTES_PER_KIB
}

function resolveConcurrency(value: string, fileSize: number): number {
  if (value !== 'auto') return Number(value)
  return fileSize >= BYTES_PER_GIB ? 8 : 4
}

function calculateUploadMetrics(
  loadedBytes: number,
  totalBytes: number,
  uploadStartTime: number
): UploadMetrics {
  const elapsedSeconds = Math.max((Date.now() - uploadStartTime) / 1000, 0.001)
  const bytesPerSecond = loadedBytes / elapsedSeconds
  const remainingBytes = Math.max(totalBytes - loadedBytes, 0)

  return {
    uploadedBytes: loadedBytes,
    progressPercentage: Math.min(Math.round((loadedBytes / totalBytes) * 100), 100),
    uploadTimeSeconds: Number(elapsedSeconds.toFixed(2)),
    uploadSpeedMbps: Number(((bytesPerSecond * 8) / 1_000_000).toFixed(2)),
    uploadSpeedMiBps: Number((bytesPerSecond / BYTES_PER_MIB).toFixed(2)),
    estimatedSecondsRemaining:
      bytesPerSecond > 0 ? Number((remainingBytes / bytesPerSecond).toFixed(0)) : null,
  }
}

function formatDataSize(bytes: number): string {
  if (bytes >= BYTES_PER_GIB) return `${formatNumber(bytes / BYTES_PER_GIB)} GiB`
  if (bytes >= BYTES_PER_MIB) return `${formatNumber(bytes / BYTES_PER_MIB)} MiB`
  return `${formatNumber(bytes / BYTES_PER_KIB)} KiB`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en', { maximumFractionDigits: value >= 10 ? 1 : 2 }).format(value)
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} sec`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes} min ${remainingSeconds} sec`
}

function formatTestTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}

function getStatusLabel(status: FinalUploadStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
  }
}

function getComparisonKey(result: LargeFileUploadTestResult): string {
  return [
    result.file.name,
    result.file.size,
    result.file.lastModified,
    result.blockSizeKiB,
    result.concurrency,
  ].join(':')
}

function isFinalStatus(status: UploadStatus): status is FinalUploadStatus {
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
  if (isOffline) return 'You appear to be offline. Reconnect, then try the upload again.'
  if (error instanceof UploadPreparationTimeoutError) {
    return 'Preparing the secure upload URL took too long. Try again in a moment.'
  }

  const status =
    error instanceof HttpErrorResponse
      ? error.status
      : isUploadErrorWithStatus(error)
        ? error.statusCode
        : undefined
  const code = isUploadErrorWithStatus(error) ? error.code : undefined

  if (status === 401 || status === 403 || code === 'AuthenticationFailed') {
    return 'The secure upload URL expired or was rejected. Start the test again.'
  }
  if (status === 429) return 'Azure is limiting requests right now. Wait a moment, then try again.'
  if (status != null && status >= 500) {
    return 'The Azure upload service is unavailable right now. Try again in a moment.'
  }
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'The upload service could not be reached. Check your connection and try again.'
  }
  return 'The upload did not complete. Check your connection and try again.'
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
        finish(() => reject(error instanceof Error ? error : new Error(String(error))))
    )
  })
}
