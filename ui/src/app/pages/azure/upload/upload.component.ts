import { Component, OnDestroy, OnInit } from '@angular/core'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import axios from 'axios'
import { BlockBlobClient, BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import { RegionService, SeoService, UtilsService } from '../../../services'
import { RegionModel } from '../../../models'
import { environment } from '../../../../environments/environment'

interface UploadSpeedTestResult {
  displayName: string
  physicalLocation: string
  uploadProgressPercentage: number
  uploadTimeSeconds: number
  uploadSpeedMbps: number
}

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html'
})
export class UploadComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  regions: RegionModel[] = []
  uploadSizeMBOptions = [100, 200, 500]

  selectedUploadSizeBytes: number = 100 * 1024 * 1024 // Default to 100MB

  testResults: UploadSpeedTestResult[] = []
  constructor(
    private regionService: RegionService,
    private utilsService: UtilsService,
    private seoService: SeoService
  ) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Storage Upload Speed Test')
    this.seoService.setMetaDescription(
      'Test the upload speed to Azure Storage Service across different regions worldwide.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/Upload')
  }

  ngOnInit() {
    this.regionService.selectedRegions$.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.regions = res || []
    })
  }

  async onSubmit() {
    this.testResults = []
    for (const region of this.regions) {
      const regionName = region.name
      await this.uploadToAzure(region, regionName)
    }
  }

  async uploadToAzure(region: RegionModel, regionName: string) {
    const { displayName, physicalLocation } = region

    const newTestResult: UploadSpeedTestResult = {
      displayName,
      physicalLocation,
      uploadProgressPercentage: 0,
      uploadTimeSeconds: 0,
      uploadSpeedMbps: 0
    }
    this.testResults.push(newTestResult)

    const sasUrl = await this.getSasUrl(regionName, this.utilsService.getRandomBlobName())
    const blockBlobClient = new BlockBlobClient(sasUrl)
    const uploadStartTime = Date.now()
    const options: BlockBlobParallelUploadOptions = {
      blockSize: 4 * 1024 * 1024, // 4MB
      concurrency: 4,
      maxSingleShotSize: 0,
      onProgress: ({ loadedBytes }) => {
        const elapsedSeconds = (Date.now() - uploadStartTime) / 1000
        const bytesUploaded = loadedBytes / 1024 / 1024
        const uploadSpeedMbps = bytesUploaded / elapsedSeconds
        const uploadProgressPercentage = Math.round(
          (loadedBytes / this.selectedUploadSizeBytes) * 100
        )
        const index = this.testResults.findIndex((item) => item.displayName === displayName)
        if (index !== -1) {
          this.testResults[index].uploadProgressPercentage = uploadProgressPercentage
          this.testResults[index].uploadTimeSeconds = elapsedSeconds
          this.testResults[index].uploadSpeedMbps = uploadSpeedMbps
        }
      }
    }

    try {
      await blockBlobClient.uploadData(this.createTestData(this.selectedUploadSizeBytes), options)
      this.testResults.sort((a, b) => b.uploadSpeedMbps - a.uploadSpeedMbps)
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
    const url = `${environment.apiEndpoint}/api/sas`
    const params = { regionName, blobName, operation }
    try {
      const response = await axios.get(url, { params })
      return response.data.url
    } catch (error) {
      console.error('Failed to get SAS URL:', error)
      throw error
    }
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
