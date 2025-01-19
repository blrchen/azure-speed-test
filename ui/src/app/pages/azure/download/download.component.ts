import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import axios from 'axios'
import { RegionService, SeoService } from '../../../services'
import { RegionModel } from '../../../models'
import { environment } from '../../../../environments/environment'

interface SasUrlInfo {
  url: string
}

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html'
})
export class DownloadComponent implements OnInit, OnDestroy {
  tableData: RegionModel[] = []
  regions: RegionModel[] = []
  private destroy$ = new Subject<void>()

  constructor(
    private regionService: RegionService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    try {
      console.log('DownloadComponent constructor - platformId:', this.platformId)
      this.initializeSeoProperties()
    } catch (error) {
      console.error('Error in DownloadComponent constructor:', error)
    }
  }

  ngOnInit() {
    try {
      console.log('DownloadComponent ngOnInit')
      if (isPlatformBrowser(this.platformId)) {
        console.log('Setting up regions subscription')
        this.regionService.selectedRegions$.pipe(takeUntil(this.destroy$)).subscribe(
          (res) => {
            console.log('Received regions update:', res?.length)
            this.regions = res || []
            this.tableData = res || []
            if (this.regions.length) {
              this.regions.forEach((item, index) => {
                this.getDownloadUrl(item, index)
              })
            }
          },
          (error) => {
            console.error('Error in regions subscription:', error)
          }
        )
      }
    } catch (error) {
      console.error('Error in DownloadComponent ngOnInit:', error)
    }
  }

  async getDownloadUrl(region: RegionModel, index: number) {
    const { name: regionName } = region
    const blobName = '100MB.bin'
    try {
      const res = await this.getSasUrl(regionName, blobName, 'download')
      const url = res.url || ''
      if (url) {
        this.tableData[index].url = url
      }
    } catch (error) {
      console.error('Error fetching download URL:', error)
    }
  }

  async getSasUrl(regionName: string, blobName: string, operation = 'upload'): Promise<SasUrlInfo> {
    const url = `${environment.apiEndpoint}/api/sas`
    const params = {
      regionName,
      blobName,
      operation
    }
    try {
      const response = await axios.get<SasUrlInfo>(url, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching SAS URL:', error)
      throw error
    }
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Storage Download Speed Test')
    this.seoService.setMetaDescription(
      'Test the download speed from Azure Storage Service across different regions worldwide.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/Download')
  }
}
