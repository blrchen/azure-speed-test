import {
  ChangeDetectionStrategy,
  Component,
  effect,
  EffectRef,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal
} from '@angular/core'
import { CommonModule, isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { RegionService, SeoService } from '../../../services'
import { RegionModel } from '../../../models'
import { API_ENDPOINT } from '../../../shared/constants'
import { RegionGroupComponent } from '../../shared'
import { HeroIconComponent } from '../../../shared/icons/hero-icons.imports'

interface SasUrlInfo {
  url: string
}

interface DownloadRow extends RegionModel {
  url?: string
}

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [CommonModule, RegionGroupComponent, HeroIconComponent],
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadComponent implements OnInit, OnDestroy {
  readonly regions = signal<RegionModel[]>([])
  readonly tableData = signal<DownloadRow[]>([])

  private regionService = inject(RegionService)
  private seoService = inject(SeoService)
  private platformId = inject(PLATFORM_ID)
  private http = inject(HttpClient)
  private readonly isBrowser = isPlatformBrowser(this.platformId)
  private readonly selectedRegionsEffect: EffectRef | null = this.isBrowser
    ? effect(() => {
        const regions = this.regionService.selectedRegions()
        this.regions.set(regions)
        const initializedRows: DownloadRow[] = regions.map((region) => ({
          ...region,
          url: undefined
        }))
        this.tableData.set(initializedRows)

        if (!initializedRows.length) {
          return
        }

        initializedRows.forEach((item) => {
          void this.getDownloadUrl(item)
        })
      })
    : null

  ngOnInit() {
    this.initializeSeoProperties()
  }

  async getDownloadUrl(region: DownloadRow) {
    const { regionId: regionName } = region
    const blobName = '100MB.bin'
    try {
      const res = await this.getSasUrl(regionName, blobName, 'download')
      const url = res.url || ''
      if (url) {
        this.tableData.update((rows) =>
          rows.map((row) => (row.regionId === region.regionId ? { ...row, url } : row))
        )
      }
    } catch (error) {
      console.error('Error fetching download URL:', error)
    }
  }

  async getSasUrl(regionName: string, blobName: string, operation = 'upload'): Promise<SasUrlInfo> {
    const url = `${API_ENDPOINT}/api/sas`
    const params = {
      regionName,
      blobName,
      operation
    }
    try {
      return await firstValueFrom(this.http.get<SasUrlInfo>(url, { params }))
    } catch (error) {
      console.error('Error fetching SAS URL:', error)
      throw error
    }
  }

  ngOnDestroy() {
    this.selectedRegionsEffect?.destroy()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Storage Download Speed Test')
    this.seoService.setMetaDescription(
      'Test the download speed from Azure Storage Service across different regions worldwide.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/Download')
  }
}
