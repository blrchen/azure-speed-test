import { Component, OnInit } from '@angular/core'
import axios from 'axios'
import { BlockBlobClient, BlockBlobParallelUploadOptions } from '@azure/storage-blob'
import { RegionService, SeoService, UtilsService } from '../../../services'
import { RegionModel } from '../../../models'
import { environment } from '../../../../environments/environment'

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

@Component({
  selector: 'app-upload-large-file',
  templateUrl: './upload-large-file.component.html'
})
export class UploadLargeFileComponent implements OnInit {
  regions: RegionModel[] = []
  blockSizeKBOptions = [256, 512, 1024, 4096]
  concurrencyOptions = [1, 2, 4, 8, 16]
  uploadProgressPercentage: number = 0

  selectedFile: File | null = null
  selectedRegion = ''
  selectedBlockSizeKB = 4096
  selectedConcurrency = 4

  testResults: LargeFileUploadTestResult[] = []

  constructor(
    private regionService: RegionService,
    private utilsService: UtilsService,
    private seoService: SeoService
  ) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Large File Upload Speed Test')
    this.seoService.setMetaDescription(
      'Test the upload speed of large files to Azure worldwide data centers.'
    )
    this.seoService.setMetaKeywords('Azure, Blob Storage, File Upload, Speed Test, Cloud Storage')
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/UploadLargeFile')
  }

  ngOnInit() {
    this.regions = this.regionService.getAllRegions()
  }

  onFileChange($event: Event) {
    const target = $event.target as HTMLInputElement
    this.selectedFile = target.files ? target.files[0] : null
  }

  async onSubmit() {
    if (!this.selectedRegion || !this.selectedFile) {
      return
    }
    await this.uploadBlob(this.selectedFile, this.selectedRegion)
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
    this.testResults.push(newTestResult)

    const sasUrl = await this.getSasUrl(regionName, this.utilsService.getRandomBlobName())
    const blockBlobClient = new BlockBlobClient(sasUrl)
    const uploadStartTime = Date.now()
    const options: BlockBlobParallelUploadOptions = {
      blockSize: this.selectedBlockSizeKB * 1024,
      concurrency: this.selectedConcurrency,
      maxSingleShotSize: 0,
      onProgress: ({ loadedBytes }) => {
        const elapsedSeconds = (Date.now() - uploadStartTime) / 1000
        const bytesUploaded = loadedBytes / 1024 / 1024
        const uploadSpeedMbps = bytesUploaded / elapsedSeconds
        const uploadProgressPercentage = Math.round((loadedBytes / file.size) * 100)
        const index = this.testResults.findIndex((item) => item.id === id)
        if (index !== -1) {
          this.testResults[index].uploadProgressPercentage = uploadProgressPercentage
          this.testResults[index].uploadTimeSeconds = elapsedSeconds
          this.testResults[index].uploadSpeedMbps = uploadSpeedMbps
        }
        this.uploadProgressPercentage = uploadProgressPercentage
      }
    }

    try {
      await blockBlobClient.uploadData(file, options)
    } catch (error) {
      console.error('Failed to upload data:', error)
      throw error
    }
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
}
