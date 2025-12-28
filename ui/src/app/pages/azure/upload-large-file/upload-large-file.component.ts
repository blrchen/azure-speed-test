import { DecimalPipe } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { BlockBlobClient, BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import { firstValueFrom, startWith } from 'rxjs'

import { RegionModel } from '../../../models'
import { RegionService, SeoService } from '../../../services'
import { API_ENDPOINT } from '../../../shared/constants'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { generateTimestampedBlobName } from '../../../shared/utils'

interface LargeFileUploadTestResult {
  id: string
  fileName: string
  fileSize: number
  region: string
  concurrency: number
  blockSizeKB: number
  uploadTimeSeconds: number
  uploadSpeedMbps: number
}

interface UploadFormGroup {
  region: FormControl<string>
  blockSizeKB: FormControl<number>
  concurrency: FormControl<number>
}

@Component({
  selector: 'app-upload-large-file',
  imports: [DecimalPipe, ReactiveFormsModule, LucideIconComponent],
  templateUrl: './upload-large-file.component.html',
  styleUrl: './upload-large-file.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadLargeFileComponent implements OnInit {
  readonly regions = signal<RegionModel[]>([])
  readonly blockSizeKBOptions = [256, 512, 1024, 4096] as const
  readonly concurrencyOptions = [1, 2, 4, 8, 16] as const
  readonly uploadProgressPercentage = signal(0)
  readonly selectedFile = signal<File | null>(null)
  readonly testResults = signal<LargeFileUploadTestResult[]>([])
  readonly uploadError = signal<string | null>(null)

  private readonly regionService = inject(RegionService)
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)

  readonly form = new FormGroup<UploadFormGroup>({
    region: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    blockSizeKB: new FormControl(4096, {
      nonNullable: true,
      validators: [Validators.required]
    }),
    concurrency: new FormControl(4, {
      nonNullable: true,
      validators: [Validators.required]
    })
  })

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() }
  )

  readonly selectedRegion = computed(() => this.formValue().region ?? '')
  readonly selectedBlockSizeKB = computed(() => this.formValue().blockSizeKB ?? 4096)
  readonly selectedConcurrency = computed(() => this.formValue().concurrency ?? 4)

  ngOnInit() {
    this.seoService.setMetaTitle('Large File Upload Speed Test')
    this.seoService.setMetaDescription(
      'Test the upload speed of large files to Azure worldwide data centers.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/UploadLargeFile')
    this.regions.set(this.regionService.getAllRegions())
  }

  isBlockSizeSelected(size: number): boolean {
    return this.form.controls.blockSizeKB.value === size
  }

  isConcurrencySelected(concurrency: number): boolean {
    return this.form.controls.concurrency.value === concurrency
  }

  onFileChange($event: Event) {
    const target = $event.target as HTMLInputElement
    this.selectedFile.set(target.files ? (target.files[0] ?? null) : null)
  }

  async onSubmit() {
    const file = this.selectedFile()
    const region = this.selectedRegion()
    if (this.form.invalid || !file || !region) {
      this.form.markAllAsTouched()
      return
    }
    await this.uploadBlob(file, region)
  }

  async uploadBlob(file: File, regionName: string) {
    const id = generateTimestampedBlobName()
    const blockSizeKB = this.selectedBlockSizeKB()
    const concurrency = this.selectedConcurrency()
    const newTestResult: LargeFileUploadTestResult = {
      id,
      fileName: file.name,
      fileSize: file.size / 1024 / 1024,
      region: regionName,
      concurrency,
      blockSizeKB,
      uploadTimeSeconds: 0,
      uploadSpeedMbps: 0
    }
    this.testResults.update((results) => [...results, newTestResult])
    this.uploadProgressPercentage.set(0)

    const sasUrl = await this.getSasUrl(regionName, generateTimestampedBlobName())
    const blockBlobClient = new BlockBlobClient(sasUrl)
    const uploadStartTime = Date.now()
    const options: BlockBlobParallelUploadOptions = {
      blockSize: blockSizeKB * 1024,
      concurrency,
      maxSingleShotSize: 0,
      onProgress: ({ loadedBytes }) => {
        const elapsedSeconds = Math.max((Date.now() - uploadStartTime) / 1000, 0)
        const uploadTimeSeconds = Number(elapsedSeconds.toFixed(2))
        const bytesUploaded = loadedBytes / 1024 / 1024
        const uploadSpeedMbps =
          elapsedSeconds > 0 ? Number((bytesUploaded / elapsedSeconds).toFixed(2)) : 0
        const uploadProgressPercentage = Math.min(Math.round((loadedBytes / file.size) * 100), 100)
        this.uploadProgressPercentage.set(uploadProgressPercentage)
        this.updateTestResult(id, {
          uploadTimeSeconds,
          uploadSpeedMbps
        })
      }
    }

    try {
      await blockBlobClient.uploadData(file, options)
      const elapsedSeconds = Math.max((Date.now() - uploadStartTime) / 1000, 0)
      const uploadTimeSeconds = Number(elapsedSeconds.toFixed(2))
      const uploadSpeedMbps =
        elapsedSeconds > 0 ? Number((file.size / 1024 / 1024 / elapsedSeconds).toFixed(2)) : 0
      this.uploadProgressPercentage.set(100)
      this.updateTestResult(id, {
        uploadTimeSeconds,
        uploadSpeedMbps
      })
    } catch {
      this.uploadError.set('Upload failed. Please try again.')
      this.testResults.update((results) => results.filter((r) => r.id !== id))
    }
  }

  async getSasUrl(regionName: string, blobName: string, operation = 'upload') {
    const url = `${API_ENDPOINT}/api/sas`
    const params = { regionName, blobName, operation }
    const response = await firstValueFrom(this.http.get<{ url: string }>(url, { params }))
    return response.url
  }

  private updateTestResult(id: string, partial: Partial<LargeFileUploadTestResult>): void {
    this.testResults.update((results) =>
      results.map((result) => (result.id === id ? { ...result, ...partial } : result))
    )
  }
}
