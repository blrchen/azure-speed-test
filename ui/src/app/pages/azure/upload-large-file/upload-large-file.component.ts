import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { BlockBlobClient, BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import { firstValueFrom } from 'rxjs'
import { RegionService, SeoService, UtilsService } from '../../../services'
import { RegionModel } from '../../../models'
import { API_ENDPOINT } from '../../../shared/constants'
import { HeroIconComponent } from '../../../shared/icons/hero-icons.imports'

interface LargeFileUploadTestResult {
  id: string
  fileName: string
  fileSize: number
  region: string
  concurrency: number
  blockSizeKB: number
  uploadProgressPercentage: number
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
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeroIconComponent],
  templateUrl: './upload-large-file.component.html',
  styleUrls: ['./upload-large-file.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadLargeFileComponent implements OnInit {
  readonly regions = signal<RegionModel[]>([])
  readonly blockSizeKBOptions = [256, 512, 1024, 4096] as const
  readonly concurrencyOptions = [1, 2, 4, 8, 16] as const
  readonly uploadProgressPercentage = signal(0)
  readonly selectedFile = signal<File | null>(null)
  readonly testResults = signal<LargeFileUploadTestResult[]>([])

  private regionService = inject(RegionService)
  private utilsService = inject(UtilsService)
  private seoService = inject(SeoService)
  private http = inject(HttpClient)

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

  ngOnInit() {
    this.initializeSeoProperties()
    this.regions.set(this.regionService.getAllRegions())
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Large File Upload Speed Test')
    this.seoService.setMetaDescription(
      'Test the upload speed of large files to Azure worldwide data centers.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/UploadLargeFile')
  }

  get regionControl(): FormControl<string> {
    return this.form.controls.region
  }

  get blockSizeControl(): FormControl<number> {
    return this.form.controls.blockSizeKB
  }

  get concurrencyControl(): FormControl<number> {
    return this.form.controls.concurrency
  }

  get selectedRegion(): string {
    return this.regionControl.value
  }

  get selectedBlockSizeKB(): number {
    return this.blockSizeControl.value
  }

  get selectedConcurrency(): number {
    return this.concurrencyControl.value
  }

  onFileChange($event: Event) {
    const target = $event.target as HTMLInputElement
    this.selectedFile.set(target.files ? (target.files[0] ?? null) : null)
  }

  async onSubmit() {
    const file = this.selectedFile()
    if (this.form.invalid || !file || !this.selectedRegion) {
      this.form.markAllAsTouched()
      return
    }
    await this.uploadBlob(file, this.selectedRegion)
  }

  async uploadBlob(file: File, regionName: string) {
    const id = this.utilsService.getRandomBlobName()
    const newTestResult: LargeFileUploadTestResult = {
      id,
      fileName: file.name,
      fileSize: file.size / 1024 / 1024,
      region: this.selectedRegion,
      concurrency: this.selectedConcurrency,
      blockSizeKB: this.selectedBlockSizeKB,
      uploadProgressPercentage: 0,
      uploadTimeSeconds: 0,
      uploadSpeedMbps: 0
    }
    this.testResults.update((results) => [...results, newTestResult])
    this.uploadProgressPercentage.set(0)

    const sasUrl = await this.getSasUrl(regionName, this.utilsService.getRandomBlobName())
    const blockBlobClient = new BlockBlobClient(sasUrl)
    const uploadStartTime = Date.now()
    const options: BlockBlobParallelUploadOptions = {
      blockSize: this.selectedBlockSizeKB * 1024,
      concurrency: this.selectedConcurrency,
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
          uploadProgressPercentage,
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
        uploadProgressPercentage: 100,
        uploadTimeSeconds,
        uploadSpeedMbps
      })
    } catch (error) {
      console.error('Failed to upload data:', error)
      throw error
    }
  }

  async getSasUrl(regionName: string, blobName: string, operation = 'upload') {
    const url = `${API_ENDPOINT}/api/sas`
    const params = { regionName, blobName, operation }
    try {
      const response = await firstValueFrom(this.http.get<{ url: string }>(url, { params }))
      return response.url
    } catch (error) {
      console.error('Failed to get SAS URL:', error)
      throw error
    }
  }

  private updateTestResult(id: string, partial: Partial<LargeFileUploadTestResult>): void {
    this.testResults.update((results) =>
      results.map((result) => (result.id === id ? { ...result, ...partial } : result))
    )
  }
}
