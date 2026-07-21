import { isPlatformBrowser, Location } from '@angular/common'
import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core'
import { form, FormField } from '@angular/forms/signals'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'

import { SeoService } from '../../../../services/seo.service'
import { ServiceTagsLoader } from '../../../../services/service-tags-loader.service'
import {
  buildServiceTagHref,
  ServiceTagCloud,
  ServiceTagCloudDirectoryEntry,
  ServiceTagRegionDirectories,
  ServiceTagRegionDirectoryEntry,
  ServiceTagRegionStatus,
} from '../../../../services/service-tags-snapshot'
import { LucideIconComponent } from '../../../../shared/icons/lucide-icons.component'
import {
  formatDirectoryCount,
  normalizeDirectoryCloud,
  normalizeDirectoryGroup,
  normalizeDirectorySearch,
  normalizeRegionStatus,
  normalizeSearchText,
  SERVICE_TAG_STATUS_OPTIONS,
  statusLabel,
  toDomId,
  toQueryValue,
} from '../service-tag-directory.helpers'

type DirectoryLoadState = 'idle' | 'loading' | 'loaded' | 'error'
type RegionStatusFilter = ServiceTagRegionStatus | ''

interface RegionViewState {
  readonly search: string
  readonly cloud: ServiceTagCloud
  readonly status: RegionStatusFilter
  readonly regionGroup: string
}

interface RegionGroup {
  readonly label: string
  readonly headingId: string
  readonly regions: readonly ServiceTagRegionDirectoryEntry[]
}

interface RegionDirectory {
  readonly filteredRegionCount: number
  readonly groups: readonly RegionGroup[]
}

interface RegionGroupOption {
  readonly value: string
  readonly label: string
  readonly count: number
}

interface StatusOption {
  readonly value: RegionStatusFilter
  readonly label: string
  readonly count: number
}

const PAGE_URL = 'https://www.azurespeed.com/Information/AzureIpRangesByRegion'
const PAGE_DESCRIPTION =
  'Browse Microsoft Azure service-tag address prefixes by region and cloud for firewall, proxy, and routing configuration.'
const DEFAULT_STATUS: ServiceTagRegionStatus = 'available'
const REGION_COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

@Component({
  selector: 'app-azure-ip-ranges-by-region',
  imports: [FormField, RouterLink, LucideIconComponent],
  templateUrl: './azure-ip-ranges-by-region.component.html',
  styleUrl: './azure-ip-ranges-by-region.component.css',
  host: {
    class: 'block',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class AzureIpRangesByRegionComponent implements OnInit {
  private readonly seoService = inject(SeoService)
  private readonly serviceTagsLoader = inject(ServiceTagsLoader)
  private readonly location = inject(Location)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly canSyncUrl = signal(false)
  private readonly retryDirectories = signal<ServiceTagRegionDirectories | null>(null)

  protected readonly statusLabel = statusLabel

  readonly serviceTagDirectories = input<ServiceTagRegionDirectories | null>(null)
  readonly q = input('', { transform: normalizeDirectorySearch })
  readonly cloud = input<ServiceTagCloud, string | undefined>('public', {
    transform: normalizeDirectoryCloud,
  })
  readonly status = input<RegionStatusFilter, string | undefined>(DEFAULT_STATUS, {
    transform: normalizeRegionStatus,
  })
  readonly group = input('', { transform: normalizeDirectoryGroup })

  readonly loadState = signal<DirectoryLoadState>('idle')
  readonly directories = computed(() => this.retryDirectories() ?? this.serviceTagDirectories())
  readonly cloudOptions = computed(() => this.directories()?.clouds ?? [])
  readonly selectedCloud = computed<ServiceTagCloudDirectoryEntry | undefined>(() =>
    this.cloudOptions().find((option) => option.id === this.filtersModel().cloud)
  )
  readonly statusOptions = computed<readonly StatusOption[]>(() => {
    const regions = this.regionsForSelectedCloud()
    return SERVICE_TAG_STATUS_OPTIONS.map((option) => ({
      ...option,
      count: regions.filter((region) => region.status === option.value).length,
    })).filter((option) => option.count > 0)
  })

  private readonly routeViewState = computed<RegionViewState>(() => ({
    search: this.q(),
    cloud: this.cloud(),
    status: this.status(),
    regionGroup: this.group(),
  }))

  readonly filtersModel = linkedSignal(() => this.routeViewState())
  readonly filtersForm = form(this.filtersModel, { name: 'ipRangesByRegionFilters' })
  readonly regionsForSelectedCloud = computed(() => {
    const directories = this.directories()
    const cloud = this.filtersModel().cloud
    return directories?.regionDirectory.filter((region) => region.cloud === cloud) ?? []
  })
  readonly availableRegionGroups = computed<readonly RegionGroupOption[]>(() => {
    const status = this.filtersModel().status
    const regions = this.regionsForSelectedCloud().filter(
      (region) => !status || region.status === status
    )
    const groupCounts = new Map<string, number>()

    for (const region of regions) {
      groupCounts.set(region.regionGroup, (groupCounts.get(region.regionGroup) ?? 0) + 1)
    }

    return [...groupCounts.entries()]
      .map(([label, count]) => ({ value: toQueryValue(label), label, count }))
      .sort((left, right) => REGION_COLLATOR.compare(left.label, right.label))
  })

  readonly regionDirectory = computed<RegionDirectory>(() => {
    const { search, status, regionGroup } = this.filtersModel()
    const normalizedSearch = normalizeSearchText(search.trim())
    const matches = this.regionsForSelectedCloud()
      .filter((region) => !status || region.status === status)
      .filter((region) => !regionGroup || toQueryValue(region.regionGroup) === regionGroup)
      .filter((region) => {
        if (!normalizedSearch) return true

        return [
          region.displayName,
          region.regionId,
          region.canonicalRegionId,
          region.regionGroup,
          region.geography,
          region.serviceTagId,
          statusLabel(region.status),
        ].some((value) => normalizeSearchText(value).includes(normalizedSearch))
      })
      .sort((left, right) => REGION_COLLATOR.compare(left.displayName, right.displayName))

    const groups = new Map<string, ServiceTagRegionDirectoryEntry[]>()
    for (const region of matches) {
      const existing = groups.get(region.regionGroup)
      if (existing) existing.push(region)
      else groups.set(region.regionGroup, [region])
    }

    return {
      filteredRegionCount: matches.length,
      groups: [...groups.entries()]
        .map(([label, regions]) => ({
          label,
          headingId: toDomId('service-tag-group', label),
          regions,
        }))
        .sort((left, right) => REGION_COLLATOR.compare(left.label, right.label)),
    }
  })

  readonly resultSummary = computed(() => {
    const filtered = this.regionDirectory().filteredRegionCount
    const total = this.regionsForSelectedCloud().length
    const cloudLabel = this.selectedCloud()?.label ?? 'Azure Public'
    return `Showing ${formatDirectoryCount(filtered)} of ${formatDirectoryCount(total)} regions in ${cloudLabel}`
  })

  readonly hasActiveFilters = computed(() => {
    const { search, status, regionGroup } = this.filtersModel()
    return Boolean(search.trim() || regionGroup || status !== DEFAULT_STATUS)
  })
  readonly selectedStatusLabel = computed(() => {
    const status = this.filtersModel().status
    return status ? statusLabel(status) : 'All statuses'
  })

  constructor() {
    if (this.isBrowser) {
      afterNextRender(() => this.canSyncUrl.set(true))

      effect(() => {
        if (!this.canSyncUrl()) return
        this.syncUrlState(this.filtersModel(), this.routeViewState())
      })
    }
  }

  ngOnInit(): void {
    const defaultRegions =
      this.serviceTagDirectories()?.regionDirectory.filter(
        (region) => region.cloud === 'public' && region.status === DEFAULT_STATUS
      ) ?? []

    this.seoService.setPageMeta({
      title: 'Azure IP Ranges by Region | Microsoft Service Tags',
      description: PAGE_DESCRIPTION,
      canonicalUrl: PAGE_URL,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Azure IP ranges by region',
        description: PAGE_DESCRIPTION,
        url: PAGE_URL,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: defaultRegions.length,
          itemListElement: defaultRegions.map((region, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: region.displayName,
            url: `https://www.azurespeed.com${buildServiceTagHref(region.cloud, region.serviceTagId, region.requiresCloudRoute)}`,
          })),
        },
      },
    })
  }

  clearFilters(): void {
    this.filtersModel.update((state) => ({
      ...state,
      search: '',
      status: DEFAULT_STATUS,
      regionGroup: '',
    }))
  }

  clearSearch(): void {
    this.filtersModel.update((state) => ({ ...state, search: '' }))
  }

  onEscape(): void {
    if (this.filtersModel().search) this.clearSearch()
  }

  regionHref(region: ServiceTagRegionDirectoryEntry): string {
    return buildServiceTagHref(
      region.cloud,
      region.serviceTagId,
      region.requiresCloudRoute,
      'region'
    )
  }

  cloudQueryParams(): { cloud: ServiceTagCloud } | undefined {
    const cloud = this.filtersModel().cloud
    return cloud === 'public' ? undefined : { cloud }
  }

  async retryLoad(): Promise<void> {
    if (this.loadState() === 'loading') return
    this.loadState.set('loading')

    try {
      this.retryDirectories.set(await this.serviceTagsLoader.reloadRegionDirectories())
      this.loadState.set('loaded')
    } catch {
      this.loadState.set('error')
    }
  }

  private syncUrlState(nextState: RegionViewState, routeState: RegionViewState): void {
    const nextQueryParams = this.buildQueryParams(nextState)
    const currentQueryParams = this.buildQueryParams(routeState)
    if (JSON.stringify(nextQueryParams) === JSON.stringify(currentQueryParams)) return

    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: nextQueryParams,
      queryParamsHandling: 'merge',
      preserveFragment: true,
    })
    this.location.replaceState(this.router.serializeUrl(urlTree))
  }

  private buildQueryParams(state: RegionViewState): Record<string, string | null> {
    const search = state.search.trim()
    return {
      q: search || null,
      cloud: state.cloud === 'public' ? null : state.cloud,
      status: state.status === DEFAULT_STATUS ? null : state.status === '' ? 'all' : state.status,
      group: state.regionGroup || null,
    }
  }
}
