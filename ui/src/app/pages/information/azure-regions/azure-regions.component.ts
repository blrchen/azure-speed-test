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
import { ActivatedRoute, Router } from '@angular/router'

import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services/seo.service'
import { readInputValue, readSelectValue } from '../../../shared/form-control-value'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { replaceMergedQueryParamsIfChanged } from '../../../shared/query-param-sync'
import {
  AvailabilityZoneFilter,
  createRegionGroupCatalog,
  normalizeSearchInput,
  normalizeSearchValue,
  normalizeZoneFilterInput,
  REGION_DIRECTORY_COLLATOR as REGION_NAME_COLLATOR,
} from '../../../shared/region-directory'
import { buildRegionDetailHref } from '../../../shared/utils'

type RegionSortDirection = 'asc' | 'desc'
type RegionSortKey = 'region' | 'geography' | 'location' | 'zones' | 'pair' | 'opened'

interface RegionSortColumn {
  readonly key: RegionSortKey
  readonly label: string
  readonly align: 'left' | 'right'
}

interface RegionViewState {
  readonly search: string
  readonly regionGroup: string
  readonly zoneSupport: AvailabilityZoneFilter
  readonly sortKey: RegionSortKey
  readonly sortDirection: RegionSortDirection
}

const ALL_REGIONS = azureGlobalCloudRegionsJson as Region[]
const UNRESTRICTED_REGIONS = ALL_REGIONS.filter((region) => !region.restricted)
const DEFAULT_SORT_KEY: RegionSortKey = 'region'
const DEFAULT_SORT_DIRECTION: RegionSortDirection = 'asc'
const REGION_GROUP_ORDER = [
  'North America',
  'Europe',
  'Asia',
  'Australia and New Zealand',
  'Middle East and Africa',
  'South America',
] as const
const REGION_GROUPS = createRegionGroupCatalog(UNRESTRICTED_REGIONS, REGION_GROUP_ORDER)
const SORT_KEYS = new Set<RegionSortKey>([
  'region',
  'geography',
  'location',
  'zones',
  'pair',
  'opened',
])
const REGION_SORT_COLUMNS: readonly RegionSortColumn[] = [
  { key: 'region', label: 'Region', align: 'left' },
  { key: 'geography', label: 'Geography', align: 'left' },
  { key: 'location', label: 'Location', align: 'left' },
  { key: 'zones', label: 'Availability zones', align: 'right' },
  { key: 'pair', label: 'Paired region', align: 'left' },
  { key: 'opened', label: 'Opened', align: 'right' },
]

function normalizeSortKeyInput(value: string | undefined): RegionSortKey {
  return SORT_KEYS.has(value as RegionSortKey) ? (value as RegionSortKey) : DEFAULT_SORT_KEY
}

function normalizeSortDirectionInput(value: string | undefined): RegionSortDirection {
  return value === 'desc' ? 'desc' : DEFAULT_SORT_DIRECTION
}

@Component({
  selector: 'app-azure-regions',
  imports: [LucideIconComponent],
  templateUrl: './azure-regions.component.html',
  styleUrl: './azure-regions.component.css',
  host: { class: 'block' },
})
export class AzureRegionsComponent implements OnInit {
  private readonly seoService = inject(SeoService)
  private readonly location = inject(Location)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly canSyncUrl = signal(false)
  private readonly regionsByDisplayName = new Map(
    ALL_REGIONS.map((region) => [region.displayName.toLowerCase(), region] as const)
  )

  readonly q = input('', { transform: normalizeSearchInput })
  readonly group = input('', { transform: REGION_GROUPS.normalizeInput })
  readonly zones = input<AvailabilityZoneFilter, string | undefined>('', {
    transform: normalizeZoneFilterInput,
  })
  readonly sort = input<RegionSortKey, string | undefined>(DEFAULT_SORT_KEY, {
    transform: normalizeSortKeyInput,
  })
  readonly dir = input<RegionSortDirection, string | undefined>(DEFAULT_SORT_DIRECTION, {
    transform: normalizeSortDirectionInput,
  })

  readonly availableRegionGroups = REGION_GROUPS.options
  readonly sortColumns = REGION_SORT_COLUMNS
  readonly totalRegionCount = UNRESTRICTED_REGIONS.length
  readonly availabilityZoneRegionCount = UNRESTRICTED_REGIONS.filter(
    (region) => (region.availabilityZoneCount ?? 0) > 0
  ).length
  readonly pairedRegionCount = UNRESTRICTED_REGIONS.filter((region) => region.pairedRegion).length

  private readonly routeViewState = computed<RegionViewState>(() => ({
    search: this.q(),
    regionGroup: this.group(),
    zoneSupport: this.zones(),
    sortKey: this.sort(),
    sortDirection: this.dir(),
  }))

  readonly filtersModel = linkedSignal(() => this.routeViewState())

  readonly filteredAzureGlobalCloudRegions = computed(() => {
    const viewState = this.filtersModel()
    const normalizedSearch = normalizeSearchValue(viewState.search.trim())
    const selectedGroup = REGION_GROUPS.byValue.get(viewState.regionGroup)?.label ?? ''

    const filteredRegions = UNRESTRICTED_REGIONS.filter((region) => {
      if (selectedGroup && region.regionGroup !== selectedGroup) return false

      const zoneCount = region.availabilityZoneCount ?? 0
      if (viewState.zoneSupport === 'supported' && zoneCount === 0) return false
      if (viewState.zoneSupport === 'unsupported' && zoneCount > 0) return false

      if (!normalizedSearch) return true

      const searchableValues = [
        region.regionId,
        region.displayName,
        region.geography,
        region.geographicGroup,
        region.regionGroup,
        region.datacenterLocation,
        region.pairedRegion,
        region.launchYear?.toString() ?? '',
      ]

      return searchableValues.some((value) =>
        normalizeSearchValue(value).includes(normalizedSearch)
      )
    })

    return [...filteredRegions].sort((left, right) =>
      this.compareRegions(left, right, viewState.sortKey, viewState.sortDirection)
    )
  })

  readonly resultSummary = computed(
    () =>
      `Showing ${this.filteredAzureGlobalCloudRegions().length} of ${this.totalRegionCount} Azure regions`
  )

  readonly hasActiveFilters = computed(() => {
    const { search, regionGroup, zoneSupport } = this.filtersModel()
    return Boolean(search.trim() || regionGroup || zoneSupport)
  })

  protected readonly buildRegionDetailHref = buildRegionDetailHref

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
    this.seoService.setPageMeta({
      title: 'Azure Regions and Data Centers',
      description:
        'Explore Azure global cloud regions by region group, location, availability zones, paired region, and approximate opening year.',
      canonicalUrl: 'https://www.azurespeed.com/Information/AzureRegions',
    })
  }

  clearFilters(): void {
    this.filtersModel.update((state) => ({
      ...state,
      search: '',
      regionGroup: '',
      zoneSupport: '',
    }))
  }

  clearSearch(): void {
    this.filtersModel.update((state) => ({ ...state, search: '' }))
  }

  updateSearch(event: Event): void {
    const search = readInputValue(event)
    this.filtersModel.update((state) => ({ ...state, search }))
  }

  updateRegionGroup(event: Event): void {
    const regionGroup = readSelectValue(event)
    this.filtersModel.update((state) => ({ ...state, regionGroup }))
  }

  updateZoneSupport(event: Event): void {
    const zoneSupport = normalizeZoneFilterInput(readSelectValue(event))
    this.filtersModel.update((state) => ({ ...state, zoneSupport }))
  }

  sortBy(sortKey: RegionSortKey): void {
    this.filtersModel.update((state) => ({
      ...state,
      sortKey,
      sortDirection:
        state.sortKey === sortKey
          ? state.sortDirection === 'asc'
            ? 'desc'
            : 'asc'
          : DEFAULT_SORT_DIRECTION,
    }))
  }

  sortAriaValue(sortKey: RegionSortKey): 'ascending' | 'descending' | null {
    const state = this.filtersModel()
    if (state.sortKey !== sortKey) return null
    return state.sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  isSortedBy(sortKey: RegionSortKey): boolean {
    return this.filtersModel().sortKey === sortKey
  }

  isSortAscending(): boolean {
    return this.filtersModel().sortDirection === 'asc'
  }

  availabilityZoneLabel(region: Region): string {
    const count = region.availabilityZoneCount ?? 0
    if (count === 0) return 'No AZ support'
    return count === 1 ? '1 zone' : `${count} zones`
  }

  pairedRegionHref(displayName: string): string | null {
    const region = this.regionsByDisplayName.get(displayName.toLowerCase())
    if (!region) return null
    return buildRegionDetailHref(displayName, region.restricted ? 'restricted' : undefined)
  }

  private compareRegions(
    left: Region,
    right: Region,
    sortKey: RegionSortKey,
    sortDirection: RegionSortDirection
  ): number {
    const direction = sortDirection === 'asc' ? 1 : -1
    let comparison: number

    switch (sortKey) {
      case 'geography':
        comparison = REGION_NAME_COLLATOR.compare(left.geography, right.geography)
        break
      case 'location':
        comparison = REGION_NAME_COLLATOR.compare(left.datacenterLocation, right.datacenterLocation)
        break
      case 'zones':
        comparison = (left.availabilityZoneCount ?? 0) - (right.availabilityZoneCount ?? 0)
        break
      case 'pair':
        comparison = this.compareOptionalText(left.pairedRegion, right.pairedRegion, direction)
        if (comparison !== 0) return comparison
        break
      case 'opened':
        comparison = this.compareOptionalNumber(left.launchYear, right.launchYear, direction)
        if (comparison !== 0) return comparison
        break
      case 'region':
        comparison = REGION_NAME_COLLATOR.compare(left.displayName, right.displayName)
        break
      default:
        return sortKey
    }

    return comparison !== 0
      ? comparison * direction
      : REGION_NAME_COLLATOR.compare(left.displayName, right.displayName)
  }

  private compareOptionalText(left: string, right: string, direction: 1 | -1): number {
    if (!left && !right) return 0
    if (!left) return 1
    if (!right) return -1
    return REGION_NAME_COLLATOR.compare(left, right) * direction
  }

  private compareOptionalNumber(
    left: number | undefined,
    right: number | undefined,
    direction: 1 | -1
  ): number {
    if (left === undefined && right === undefined) return 0
    if (left === undefined) return 1
    if (right === undefined) return -1
    return (left - right) * direction
  }

  private syncUrlState(nextState: RegionViewState, routeState: RegionViewState): void {
    replaceMergedQueryParamsIfChanged(
      { router: this.router, route: this.route, location: this.location },
      this.buildQueryParams(nextState),
      this.buildQueryParams(routeState)
    )
  }

  private buildQueryParams(state: RegionViewState): Record<string, string | null> {
    const search = state.search.trim()
    return {
      q: search || null,
      group: state.regionGroup || null,
      zones: state.zoneSupport || null,
      sort: state.sortKey === DEFAULT_SORT_KEY ? null : state.sortKey,
      dir: state.sortDirection === DEFAULT_SORT_DIRECTION ? null : state.sortDirection,
    }
  }
}
