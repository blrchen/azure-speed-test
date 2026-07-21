import { isPlatformBrowser, Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  PLATFORM_ID,
  signal,
  untracked,
} from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'

import { RegionModel } from '../../../models'
import { RegionService } from '../../../services/region.service'
import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { RegionGroupComponent } from '../../../shared/region-group/region-group.component'
import {
  buildNormalizedRegionLookup,
  buildRegionDetailHref,
  buildRegionSelectionSignature,
  getSasUrl,
  getSortedRegionIds,
  parseRegionParam,
} from '../../../shared/utils'

const DOWNLOAD_TEST_FILE_NAME = '100MB.bin'
const MAX_CONCURRENT_DOWNLOAD_PREFETCHES = 4
const REGIONS_QUERY_PARAM = 'regions'

@Component({
  selector: 'app-download-test-file',
  imports: [RouterLink, RegionGroupComponent, LucideIconComponent],
  templateUrl: './download-test-file.component.html',
  host: { class: 'block' },
})
export class DownloadTestFileComponent implements OnInit {
  private readonly regionService = inject(RegionService)
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)
  private readonly location = inject(Location)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly normalizedRegions = buildNormalizedRegionLookup(
    this.regionService.getAllRegions()
  )
  private lastUrlStateSignature = ''
  private canUpdateUrl = false
  private hasAppliedRegionsInput = false
  private readonly downloadUrls = signal<Map<string, string>>(new Map())

  readonly regions = input<string | undefined>()
  protected readonly buildRegionDetailHref = buildRegionDetailHref
  protected readonly tableData = computed(() => {
    const urls = this.downloadUrls()
    return this.regionService.selectedRegions().map((region) => ({
      ...region,
      url: urls.get(region.regionId),
    }))
  })
  protected readonly downloadLinksStatus = computed(() => {
    const rows = this.tableData()
    if (rows.length === 0) return null

    const readyCount = rows.filter((row) => Boolean(row.url)).length
    if (readyCount === rows.length) {
      return `${readyCount} ${readyCount === 1 ? 'download link' : 'download links'} ready`
    }
    return `${readyCount} of ${rows.length} download links ready`
  })
  private readonly pendingDownloadRequests = new Set<string>()
  private queuedDownloadRequests: string[] = []

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.pendingDownloadRequests.clear()
      this.queuedDownloadRequests = []
    })

    if (this.isBrowser) {
      this.registerRegionsInputEffect()
      this.registerSelectedRegionsEffect()
    }
  }

  private registerRegionsInputEffect(): void {
    effect(() => {
      this.applyRegionsInput(this.regions())
    })
  }

  private registerSelectedRegionsEffect(): void {
    effect(() => {
      const regions = this.regionService.selectedRegions()

      this.syncUrlWithSelection(getSortedRegionIds(regions.map((region) => region.regionId)))
      this.syncDownloadRequests(regions)
    })
  }

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure Download Test File Generator',
      description:
        'Generate short-lived links to 100 MiB test files hosted in Azure Storage regions for manual download testing.',
      canonicalUrl: 'https://www.azurespeed.com/Azure/DownloadTestFile',
    })
  }

  private pumpDownloadPrefetchQueue(): void {
    while (
      this.pendingDownloadRequests.size < MAX_CONCURRENT_DOWNLOAD_PREFETCHES &&
      this.queuedDownloadRequests.length > 0
    ) {
      const regionId = this.queuedDownloadRequests.shift()
      if (!regionId) continue

      this.pendingDownloadRequests.add(regionId)
      void this.prefetchDownloadUrl(regionId)
    }
  }

  private async prefetchDownloadUrl(regionId: string): Promise<void> {
    try {
      const url = await getSasUrl(this.http, regionId, DOWNLOAD_TEST_FILE_NAME, 'download')
      if (!url) return
      if (!this.regionService.selectedRegions().some((region) => region.regionId === regionId)) {
        return
      }

      this.downloadUrls.update((current) => {
        if (current.get(regionId) === url) return current
        const next = new Map(current)
        next.set(regionId, url)
        return next
      })
    } catch {
      // Network errors are expected and silently ignored
    } finally {
      this.pendingDownloadRequests.delete(regionId)
      this.pumpDownloadPrefetchQueue()
    }
  }

  private applyRegionsInput(rawRegions: string | undefined): void {
    const regions = this.resolveRegionsFromIds(parseRegionParam(rawRegions))
    const shouldApplySelection =
      (typeof rawRegions === 'string' && rawRegions.trim().length > 0) ||
      this.hasAppliedRegionsInput

    if (shouldApplySelection) {
      this.lastUrlStateSignature = buildRegionSelectionSignature(
        regions.map((region) => region.regionId)
      )
      this.regionService.updateSelectedRegions(regions)
    }

    this.canUpdateUrl = true
    this.hasAppliedRegionsInput = true
  }

  private resolveRegionsFromIds(normalizedTokens: string[]): RegionModel[] {
    const seen = new Set<string>()
    return normalizedTokens
      .map((token) => this.normalizedRegions.get(token))
      .filter((match): match is RegionModel => {
        if (!match || seen.has(match.regionId)) return false
        seen.add(match.regionId)
        return true
      })
  }

  private syncUrlWithSelection(sortedRegionIds: readonly string[]): void {
    if (!this.isBrowser || !this.canUpdateUrl) return

    const signature = buildRegionSelectionSignature(sortedRegionIds)
    if (signature === this.lastUrlStateSignature) return

    this.lastUrlStateSignature = signature

    const queryParams = { ...this.route.snapshot.queryParams }
    if (sortedRegionIds.length) {
      queryParams[REGIONS_QUERY_PARAM] = sortedRegionIds.join(',')
    } else {
      delete queryParams[REGIONS_QUERY_PARAM]
    }

    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams,
    })
    this.location.replaceState(this.router.serializeUrl(urlTree))
  }

  private syncDownloadRequests(regions: readonly RegionModel[]): void {
    const selectedIds = new Set(regions.map((region) => region.regionId))
    const urlSnapshot = this.removeStaleDownloadUrls(selectedIds)

    this.trimQueuedDownloadRequests(selectedIds)

    for (const { regionId } of regions) {
      if (this.hasDownloadRequest(regionId, urlSnapshot)) continue
      this.enqueueDownloadRequest(regionId)
    }

    this.pumpDownloadPrefetchQueue()
  }

  private removeStaleDownloadUrls(selectedIds: ReadonlySet<string>): ReadonlyMap<string, string> {
    const urlSnapshot = new Map(untracked(() => this.downloadUrls()))
    let hasUrlChanges = false

    for (const regionId of urlSnapshot.keys()) {
      if (!selectedIds.has(regionId)) {
        urlSnapshot.delete(regionId)
        hasUrlChanges = true
      }
    }

    if (hasUrlChanges) this.downloadUrls.set(urlSnapshot)

    return urlSnapshot
  }

  private trimQueuedDownloadRequests(selectedIds: ReadonlySet<string>): void {
    if (this.queuedDownloadRequests.length === 0) return

    this.queuedDownloadRequests = this.queuedDownloadRequests.filter((regionId) =>
      selectedIds.has(regionId)
    )
  }

  private hasDownloadRequest(regionId: string, urlSnapshot: ReadonlyMap<string, string>): boolean {
    return (
      !regionId ||
      urlSnapshot.has(regionId) ||
      this.pendingDownloadRequests.has(regionId) ||
      this.queuedDownloadRequests.includes(regionId)
    )
  }

  private enqueueDownloadRequest(regionId: string): void {
    this.queuedDownloadRequests.push(regionId)
  }
}
