import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EffectRef,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  untracked
} from '@angular/core'
import { RouterLink } from '@angular/router'
import { firstValueFrom } from 'rxjs'

import { RegionModel } from '../../../models'
import { RegionService, SeoService } from '../../../services'
import { API_ENDPOINT } from '../../../shared/constants'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildRegionDetailRouterLink } from '../../../shared/utils'
import { RegionGroupComponent } from '../../shared'

interface SasUrlInfo {
  url: string
}

interface DownloadRow extends RegionModel {
  url?: string
}

@Component({
  selector: 'app-download',
  imports: [RegionGroupComponent, LucideIconComponent, RouterLink],
  templateUrl: './download.component.html',
  styleUrl: './download.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadComponent implements OnInit, OnDestroy {
  private readonly regionService = inject(RegionService)
  private readonly downloadUrls = signal<Map<string, string>>(new Map())
  readonly tableData = computed<DownloadRow[]>(() => {
    const urls = this.downloadUrls()
    return this.regionService.selectedRegions().map((region) => ({
      ...region,
      url: urls.get(region.regionId) || undefined
    }))
  })
  protected readonly buildRegionRouterLink = buildRegionDetailRouterLink
  private readonly seoService = inject(SeoService)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly http = inject(HttpClient)
  private readonly isBrowser = isPlatformBrowser(this.platformId)
  private readonly pendingDownloadRequests = new Set<string>()
  private readonly downloadPrefetchEffect: EffectRef | null = this.isBrowser
    ? effect(
        () => {
          const regions = this.regionService.selectedRegions()
          const selectedIds = new Set(regions.map((region) => region.regionId))
          const urlSnapshot = new Map(untracked(() => this.downloadUrls()))
          let mutated = false

          for (const key of Array.from(urlSnapshot.keys())) {
            if (!selectedIds.has(key)) {
              urlSnapshot.delete(key)
              this.pendingDownloadRequests.delete(key)
              mutated = true
            }
          }

          if (mutated) {
            this.downloadUrls.set(urlSnapshot)
          }

          for (const region of regions) {
            const regionId = region.regionId
            if (!regionId) {
              continue
            }
            if (urlSnapshot.has(regionId) || this.pendingDownloadRequests.has(regionId)) {
              continue
            }
            this.pendingDownloadRequests.add(regionId)
            void this.prefetchDownloadUrl(region)
          }
        },
        { allowSignalWrites: true }
      )
    : null

  ngOnInit() {
    this.seoService.setMetaTitle('Azure Storage Download Speed Test')
    this.seoService.setMetaDescription(
      'Test the download speed from Azure Storage Service across different regions worldwide.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/Download')
  }

  async getSasUrl(regionName: string, blobName: string, operation = 'upload'): Promise<SasUrlInfo> {
    const url = `${API_ENDPOINT}/api/sas`
    const params = {
      regionName,
      blobName,
      operation
    }
    return await firstValueFrom(this.http.get<SasUrlInfo>(url, { params }))
  }

  ngOnDestroy() {
    this.downloadPrefetchEffect?.destroy()
    this.pendingDownloadRequests.clear()
  }

  private async prefetchDownloadUrl(region: RegionModel): Promise<void> {
    const regionName = region.regionId
    if (!regionName) {
      return
    }
    const blobName = '100MB.bin'
    try {
      const res = await this.getSasUrl(regionName, blobName, 'download')
      const url = res.url || ''
      if (!url) {
        return
      }
      this.downloadUrls.update((current) => {
        if (current.get(regionName) === url) {
          return current
        }
        const next = new Map(current)
        next.set(regionName, url)
        return next
      })
    } catch {
      // Silently handle error - URL simply won't be set
    } finally {
      this.pendingDownloadRequests.delete(regionName)
    }
  }
}
