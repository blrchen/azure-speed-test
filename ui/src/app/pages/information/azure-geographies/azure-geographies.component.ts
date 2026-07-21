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

import chinaRegionsJson from '../../../../assets/data/regions-china.json'
import upcomingRegionsJson from '../../../../assets/data/regions-upcoming.json'
import governmentRegionsJson from '../../../../assets/data/regions-usgov.json'
import globalRegionsJson from '../../../../assets/data/regions.json'
import { Region, UpcomingRegion } from '../../../models'
import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import {
  AvailabilityZoneFilter,
  countGeographies,
  formatCount,
  groupRegionsByGeography,
  normalizeSearchInput,
  normalizeSearchValue,
  normalizeZoneFilterInput,
  toQueryValue,
} from '../../../shared/region-directory'
import { buildRegionDetailHref } from '../../../shared/utils'

type GeographyScope = 'global' | 'restricted' | 'china' | 'usgov' | 'planned'
type RegionDetailSource = 'restricted' | 'china' | 'usgov'

interface DisplayRegion {
  readonly regionId: string
  readonly displayName: string
  readonly geography: string
  readonly datacenterLocation: string
  readonly availableTo: string
  readonly dataResidency: string
  readonly availabilityZoneCount?: number
  readonly announcementLink?: string
  readonly detailSource?: RegionDetailSource
  readonly planned: boolean
}

interface GeographyViewState {
  readonly search: string
  readonly scope: GeographyScope
  readonly zoneSupport: AvailabilityZoneFilter
}

interface ScopeOption {
  readonly value: GeographyScope
  readonly label: string
  readonly description: string
  readonly count: number
}

const PAGE_URL = 'https://www.azurespeed.com/Information/AzureGeographies'
const PAGE_DESCRIPTION =
  'Browse Azure geographies and regions, compare availability-zone support, and understand global, restricted, sovereign, and planned Azure region scopes.'
const DEFAULT_SCOPE: GeographyScope = 'global'
const SCOPE_VALUES = new Set<GeographyScope>(['global', 'restricted', 'china', 'usgov', 'planned'])

const GLOBAL_REGIONS = globalRegionsJson as Region[]
const CHINA_REGIONS = chinaRegionsJson as Region[]
const GOVERNMENT_REGIONS = governmentRegionsJson as Region[]
const UPCOMING_REGIONS = upcomingRegionsJson as UpcomingRegion[]

function toDisplayRegion(
  region: Region,
  detailSource?: RegionDetailSource,
  geography = region.geography
): DisplayRegion {
  return {
    regionId: region.regionId,
    displayName: region.displayName,
    geography,
    datacenterLocation: region.datacenterLocation,
    availableTo: region.availableTo,
    dataResidency: region.dataResidency ?? '',
    availabilityZoneCount: region.availabilityZoneCount,
    detailSource,
    planned: false,
  }
}

function toPlannedDisplayRegion(region: UpcomingRegion): DisplayRegion {
  return {
    regionId: region.regionId,
    displayName: region.displayName,
    geography: region.geography,
    datacenterLocation: region.datacenterLocation,
    availableTo: region.availableTo,
    dataResidency: region.dataResidency,
    announcementLink: region.announcementLink,
    planned: true,
  }
}

const REGIONS_BY_SCOPE: Readonly<Record<GeographyScope, readonly DisplayRegion[]>> = {
  global: GLOBAL_REGIONS.filter((region) => !region.restricted).map((region) =>
    toDisplayRegion(region)
  ),
  restricted: GLOBAL_REGIONS.filter((region) => region.restricted).map((region) =>
    toDisplayRegion(region, 'restricted')
  ),
  china: CHINA_REGIONS.map((region) => toDisplayRegion(region, 'china')),
  usgov: GOVERNMENT_REGIONS.map((region) => toDisplayRegion(region, 'usgov', 'US Government')),
  planned: UPCOMING_REGIONS.map(toPlannedDisplayRegion),
}

const SCOPE_OPTIONS: readonly ScopeOption[] = [
  {
    value: 'global',
    label: 'Global cloud',
    description:
      'Unrestricted regions available to customers and partners in the Azure global cloud.',
    count: REGIONS_BY_SCOPE.global.length,
  },
  {
    value: 'restricted',
    label: 'Restricted access',
    description:
      'Global cloud regions that require special onboarding or support specific customer scenarios.',
    count: REGIONS_BY_SCOPE.restricted.length,
  },
  {
    value: 'china',
    label: 'Azure China',
    description: 'Regions in the physically separate Azure China cloud operated by 21Vianet.',
    count: REGIONS_BY_SCOPE.china.length,
  },
  {
    value: 'usgov',
    label: 'US Government',
    description:
      'Regions in Azure Government for eligible US government organizations and partners.',
    count: REGIONS_BY_SCOPE.usgov.length,
  },
  {
    value: 'planned',
    label: 'Planned regions',
    description: 'Regions announced by Microsoft that are not yet listed as generally available.',
    count: REGIONS_BY_SCOPE.planned.length,
  },
]
const SCOPE_OPTIONS_BY_VALUE = new Map(
  SCOPE_OPTIONS.map((option) => [option.value, option] as const)
)

function normalizeScopeInput(value: string | undefined): GeographyScope {
  return SCOPE_VALUES.has(value as GeographyScope) ? (value as GeographyScope) : DEFAULT_SCOPE
}

const DEFAULT_GEOGRAPHIES = groupRegionsByGeography(REGIONS_BY_SCOPE.global)

@Component({
  selector: 'app-azure-geographies',
  imports: [FormField, LucideIconComponent, RouterLink],
  templateUrl: './azure-geographies.component.html',
  host: { class: 'block' },
})
export class AzureGeographiesComponent implements OnInit {
  private readonly seoService = inject(SeoService)
  private readonly location = inject(Location)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly canSyncUrl = signal(false)

  readonly q = input('', { transform: normalizeSearchInput })
  readonly scope = input<GeographyScope, string | undefined>(DEFAULT_SCOPE, {
    transform: normalizeScopeInput,
  })
  readonly zones = input<AvailabilityZoneFilter, string | undefined>('', {
    transform: normalizeZoneFilterInput,
  })

  readonly scopeOptions = SCOPE_OPTIONS
  protected readonly buildRegionDetailHref = buildRegionDetailHref

  private readonly routeViewState = computed<GeographyViewState>(() => ({
    search: this.q(),
    scope: this.scope(),
    zoneSupport: this.zones(),
  }))

  readonly filtersModel = linkedSignal(() => this.routeViewState())
  readonly filtersForm = form(this.filtersModel, { name: 'azureGeographiesFilters' })

  readonly selectedScope = computed(
    () => SCOPE_OPTIONS_BY_VALUE.get(this.filtersModel().scope) ?? SCOPE_OPTIONS[0]
  )
  readonly scopeRegions = computed(() => REGIONS_BY_SCOPE[this.filtersModel().scope])
  readonly scopeRegionCount = computed(() => this.scopeRegions().length)
  readonly scopeGeographyCount = computed(() => countGeographies(this.scopeRegions()))
  readonly availabilityZoneRegionCount = computed(
    () => this.scopeRegions().filter((region) => (region.availabilityZoneCount ?? 0) > 0).length
  )

  readonly filteredGeographies = computed(() => {
    const { search, zoneSupport } = this.filtersModel()
    const normalizedSearch = normalizeSearchValue(search.trim())

    const filteredRegions = this.scopeRegions().filter((region) => {
      const zoneCount = region.availabilityZoneCount ?? 0
      if (zoneSupport === 'supported' && zoneCount === 0) return false
      if (zoneSupport === 'unsupported' && zoneCount > 0) return false

      if (!normalizedSearch) return true

      return [
        region.regionId,
        region.displayName,
        region.geography,
        region.datacenterLocation,
        region.availableTo,
        region.dataResidency,
      ].some((value) => normalizeSearchValue(value).includes(normalizedSearch))
    })

    return groupRegionsByGeography(filteredRegions)
  })

  readonly filteredRegionCount = computed(() =>
    this.filteredGeographies().reduce((total, geography) => total + geography.regions.length, 0)
  )

  readonly resultSummary = computed(() => {
    const shownGeographies = this.filteredGeographies().length
    const shownRegions = this.filteredRegionCount()
    const totalGeographies = this.scopeGeographyCount()
    const totalRegions = this.scopeRegionCount()

    if (shownGeographies === totalGeographies && shownRegions === totalRegions) {
      return `Showing ${formatCount(shownGeographies, 'geography', 'geographies')} and ${formatCount(shownRegions, 'region', 'regions')}`
    }

    return `Showing ${shownGeographies} of ${totalGeographies} geographies and ${shownRegions} of ${totalRegions} regions`
  })

  readonly tableCaption = computed(
    () =>
      `${this.resultSummary()} in ${this.selectedScope().label}. Regions are grouped by Azure geography.`
  )

  readonly hasActiveFilters = computed(() => {
    const { search, zoneSupport } = this.filtersModel()
    return Boolean(search.trim() || zoneSupport)
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
    this.seoService.setPageMeta({
      title: 'Azure Geographies and Regions | Data Residency',
      description: PAGE_DESCRIPTION,
      canonicalUrl: PAGE_URL,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Azure geographies and regions',
        description: PAGE_DESCRIPTION,
        url: PAGE_URL,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: DEFAULT_GEOGRAPHIES.length,
          itemListElement: DEFAULT_GEOGRAPHIES.map((geography, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Thing',
              name: geography.name,
              description: `${formatCount(geography.regions.length, 'Azure region', 'Azure regions')}: ${geography.regions.map((region) => region.displayName).join(', ')}`,
              url: `${PAGE_URL}#${this.geographyAnchor(geography.name)}`,
            },
          })),
        },
      },
    })
  }

  clearFilters(): void {
    this.filtersModel.update((state) => ({ ...state, search: '', zoneSupport: '' }))
  }

  clearSearch(): void {
    this.filtersModel.update((state) => ({ ...state, search: '' }))
  }

  geographyAnchor(name: string): string {
    return `geography-${toQueryValue(name)}`
  }

  private syncUrlState(nextState: GeographyViewState, routeState: GeographyViewState): void {
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

  private buildQueryParams(state: GeographyViewState): Record<string, string | null> {
    const search = state.search.trim()
    return {
      q: search || null,
      scope: state.scope === DEFAULT_SCOPE ? null : state.scope,
      zones: state.zoneSupport || null,
    }
  }
}
