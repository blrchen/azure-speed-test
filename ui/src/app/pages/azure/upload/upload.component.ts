import {
  ChangeDetectionStrategy,
  Component,
  effect,
  EffectRef,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { BlockBlobClient, BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import { RegionService, SeoService, UtilsService } from '../../../services'
import { RegionModel } from '../../../models'
import { API_ENDPOINT } from '../../../shared/constants'
import { RegionGroupComponent } from '../../shared'
import { HeroIconComponent } from '../../../shared/icons/hero-icons.imports'

interface UploadSpeedTestResult {
  displayName: string
  datacenterLocation: string
  uploadProgressPercentage: number
  uploadTimeSeconds: number
  uploadSpeedMbps: number
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RegionGroupComponent, HeroIconComponent],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadComponent implements OnInit, OnDestroy {
  readonly uploadSizeMBOptions = [100, 200, 500] as const
  readonly regions = signal<RegionModel[]>([])
  readonly selectedUploadSizeBytes = signal<number>(100 * 1024 * 1024) // Default to 100MB
  readonly testResults = signal<UploadSpeedTestResult[]>([])

  private regionService = inject(RegionService)
  private utilsService = inject(UtilsService)
  private seoService = inject(SeoService)
  private http = inject(HttpClient)
  private readonly selectedRegionsEffect: EffectRef = effect(() => {
    this.regions.set(this.regionService.selectedRegions())
  })

  ngOnInit() {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Storage Upload Speed Test')
    this.seoService.setMetaDescription(
      'Test the upload speed to Azure Storage Service across different regions worldwide.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/Upload')
  }

  async onSubmit() {
    this.testResults.set([])
    for (const region of this.regions()) {
      const regionName = region.regionId
      await this.uploadToAzure(region, regionName)
    }
  }

  selectUploadSize(uploadSizeMB: number): void {
    this.selectedUploadSizeBytes.set(uploadSizeMB * 1024 * 1024)
  }

  async uploadToAzure(region: RegionModel, regionName: string) {
    const { displayName, datacenterLocation } = region

    const newTestResult: UploadSpeedTestResult = {
      displayName,
      datacenterLocation,
      uploadProgressPercentage: 0,
      uploadTimeSeconds: 0,
      uploadSpeedMbps: 0
    }
    this.testResults.update((results) => [...results, newTestResult])

    const sasUrl = await this.getSasUrl(regionName, this.utilsService.getRandomBlobName())
    const blockBlobClient = new BlockBlobClient(sasUrl)
    const uploadStartTime = Date.now()
    const totalBytes = this.selectedUploadSizeBytes()
    const options: BlockBlobParallelUploadOptions = {
      blockSize: 4 * 1024 * 1024, // 4MB
      concurrency: 4,
      maxSingleShotSize: 0,
      onProgress: ({ loadedBytes }) => {
        const elapsedSeconds = (Date.now() - uploadStartTime) / 1000
        const bytesUploaded = loadedBytes / 1024 / 1024
        const uploadSpeedMbps = elapsedSeconds > 0 ? bytesUploaded / elapsedSeconds : 0
        const uploadProgressPercentage = Math.min(Math.round((loadedBytes / totalBytes) * 100), 100)
        this.updateTestResult(displayName, {
          uploadProgressPercentage,
          uploadTimeSeconds: elapsedSeconds,
          uploadSpeedMbps
        })
      }
    }

    try {
      await blockBlobClient.uploadData(this.createTestData(totalBytes), options)
      const elapsedSeconds = (Date.now() - uploadStartTime) / 1000
      const uploadSpeedMbps = elapsedSeconds > 0 ? totalBytes / 1024 / 1024 / elapsedSeconds : 0
      this.updateTestResult(
        displayName,
        {
          uploadProgressPercentage: 100,
          uploadTimeSeconds: elapsedSeconds,
          uploadSpeedMbps
        },
        { sort: true }
      )
    } catch (error) {
      console.error('Failed to upload data:', error)
      throw error
    }
  }

  createTestData(size = 0): Blob {
    const byteArray = new Uint8Array(size)
    return new Blob([byteArray], { type: 'application/octet-stream' })
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

  ngOnDestroy() {
    this.selectedRegionsEffect.destroy()
  }

  private updateTestResult(
    displayName: string,
    partial: Partial<UploadSpeedTestResult>,
    options: { sort?: boolean } = {}
  ): void {
    this.testResults.update((results) => {
      const next = results.map((result) =>
        result.displayName === displayName ? { ...result, ...partial } : result
      )
      return options.sort ? next.sort((a, b) => b.uploadSpeedMbps - a.uploadSpeedMbps) : next
    })
  }
}
