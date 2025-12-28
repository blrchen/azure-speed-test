import { DecimalPipe } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BlockBlobClient, BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import { firstValueFrom } from 'rxjs'

import { RegionModel } from '../../../models'
import { RegionService, SeoService } from '../../../services'
import { API_ENDPOINT } from '../../../shared/constants'
import { ExportCsvButtonComponent } from '../../../shared/export-csv-button/export-csv-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildRegionDetailRouterLink, generateTimestampedBlobName } from '../../../shared/utils'
import { RegionGroupComponent } from '../../shared'

interface UploadSpeedTestResult {
  displayName: string
  regionId: string
  datacenterLocation: string
  uploadProgressPercentage: number
  uploadTimeSeconds: number
  uploadSpeedMbps: number
  error?: string
}

@Component({
  selector: 'app-upload',
  imports: [
    DecimalPipe,
    RouterLink,
    RegionGroupComponent,
    LucideIconComponent,
    ExportCsvButtonComponent
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadComponent implements OnInit {
  readonly uploadSizeMBOptions = [100, 200, 500, 1000] as const
  readonly selectedRegions = computed<RegionModel[]>(() => this.regionService.selectedRegions())
  readonly selectedUploadSizeMB = signal<number>(100) // Default to 100MB
  readonly selectedUploadSizeBytes = computed<number>(
    () => this.selectedUploadSizeMB() * 1024 * 1024
  )
  readonly testResults = signal<UploadSpeedTestResult[]>([])

  private readonly regionService = inject(RegionService)
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)

  ngOnInit() {
    this.seoService.setMetaTitle('Azure Storage Upload Speed Test')
    this.seoService.setMetaDescription(
      'Test the upload speed to Azure Storage Service across different regions worldwide.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/Upload')
  }

  async onSubmit() {
    this.testResults.set([])
    for (const region of this.selectedRegions()) {
      await this.uploadToAzure(region)
    }
  }

  selectUploadSize(uploadSizeMB: number): void {
    this.selectedUploadSizeMB.set(uploadSizeMB)
  }

  isSelected(uploadSizeMB: number): boolean {
    return this.selectedUploadSizeMB() === uploadSizeMB
  }

  async uploadToAzure(region: RegionModel) {
    const { displayName, datacenterLocation, regionId } = region

    const newTestResult: UploadSpeedTestResult = {
      displayName,
      regionId,
      datacenterLocation,
      uploadProgressPercentage: 0,
      uploadTimeSeconds: 0,
      uploadSpeedMbps: 0
    }
    this.testResults.update((results) => [...results, newTestResult])

    const sasUrl = await this.getSasUrl(regionId, generateTimestampedBlobName())
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
    } catch {
      this.updateTestResult(displayName, {
        error: 'Upload failed'
      })
    }
  }

  createTestData(size = 0): Blob {
    const byteArray = new Uint8Array(size)
    return new Blob([byteArray], { type: 'application/octet-stream' })
  }

  async getSasUrl(regionName: string, blobName: string, operation = 'upload') {
    const url = `${API_ENDPOINT}/api/sas`
    const params = { regionName, blobName, operation }
    const response = await firstValueFrom(this.http.get<{ url: string }>(url, { params }))
    return response.url
  }

  readonly buildRegionRouterLink = buildRegionDetailRouterLink

  // CSV export data
  readonly csvHeaders = [
    'Region',
    'Region ID',
    'Datacenter',
    'Upload Time (s)',
    'Upload Speed (MB/s)'
  ]
  readonly csvRows = computed<string[][] | null>(() => {
    const results = this.testResults()
    if (results.length === 0) return null
    return results.map((row) => [
      row.displayName,
      row.regionId,
      row.datacenterLocation,
      row.uploadTimeSeconds.toFixed(1),
      row.uploadSpeedMbps.toFixed(2)
    ])
  })

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
