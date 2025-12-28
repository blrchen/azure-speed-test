import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'

import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildRegionDetailRouterLink } from '../../../shared/utils'

const ALL_REGIONS = azureGlobalCloudRegionsJson as Region[]
const UNRESTRICTED_REGIONS = ALL_REGIONS.filter((region) => !region.restricted)
const RESTRICTED_REGIONS = ALL_REGIONS.filter((region) => region.restricted)
const REGION_GROUPS = [...new Set(ALL_REGIONS.map((region) => region.regionGroup))].sort()

@Component({
  selector: 'app-azure-regions',
  imports: [ReactiveFormsModule, RouterLink, LucideIconComponent],
  templateUrl: './azure-regions.component.html',
  styleUrl: './azure-regions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureRegionsComponent implements OnInit {
  private readonly seoService = inject(SeoService)
  private readonly formBuilder = inject(NonNullableFormBuilder)

  readonly azureGlobalCloudRegions = UNRESTRICTED_REGIONS
  readonly accessRestrictedRegions = RESTRICTED_REGIONS
  readonly availableRegionGroups = REGION_GROUPS
  readonly upcomingRegions = [
    {
      country: 'Saudi Arabia',
      name: 'Saudi Arabia East',
      link: 'https://news.microsoft.com/en-xm/2024/12/04/microsoft-shares-strong-progress-on-datacenter-region-in-saudi-arabia-construction-complete-on-three-sites-with-availability-expected-in-2026/'
    },
    {
      country: 'Taiwan',
      name: 'Taiwan North',
      link: 'https://aka.ms/TaiwanIntent'
    },
    {
      country: 'Greece',
      name: 'Greece Central',
      link: 'https://news.microsoft.com/europe/2020/10/05/microsoft-announces-plans-for-first-datacenter-region-in-greece-as-part-of-gr-for-growth-digital-transformation-initiative/'
    },
    {
      country: 'Denmark',
      name: 'Denmark East',
      link: 'https://aka.ms/DenmarkIntent'
    }
  ] as const

  readonly filtersForm = this.formBuilder.group({
    search: [''],
    geography: ['']
  })

  private readonly filtersValue = toSignal(this.filtersForm.valueChanges, {
    initialValue: this.filtersForm.getRawValue()
  })

  // Computed statistics
  readonly totalRegions = computed(() => ALL_REGIONS.length)
  readonly totalAZs = computed(() =>
    ALL_REGIONS.reduce((sum, r) => sum + (r.availabilityZoneCount || 0), 0)
  )
  readonly uniqueGeographies = computed(() => new Set(ALL_REGIONS.map((r) => r.geography)).size)

  readonly filteredAzureGlobalCloudRegions = computed(() =>
    this.filterRegions(this.azureGlobalCloudRegions)
  )
  readonly filteredAccessRestrictedRegions = computed(() =>
    this.filterRegions(this.accessRestrictedRegions)
  )

  protected readonly buildRegionRouterLink = buildRegionDetailRouterLink

  ngOnInit(): void {
    this.seoService.setMetaTitle('Azure Regions and Data Centers')
    this.seoService.setMetaDescription(
      'Explore the available and access restricted Azure regions, including their geography, physical location, availability zones, and paired regions for disaster recovery.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureRegions')
  }

  trackByRegion(_index: number, region: Region): string {
    return region.regionId
  }

  readonly hasActiveFilters = computed(() => {
    const { search, geography } = this.filtersValue()
    return Boolean((search ?? '').trim()) || Boolean(geography)
  })

  clearFilters(): void {
    this.filtersForm.setValue({ search: '', geography: '' })
  }

  private filterRegions(regions: Region[]): Region[] {
    const { search, geography } = this.filtersValue()
    const normalizedSearch = (search ?? '').trim().toLowerCase()
    const selectedGeography = geography ?? ''

    return regions.filter((region) => {
      const matchesSearch =
        !normalizedSearch ||
        region.displayName.toLowerCase().includes(normalizedSearch) ||
        region.datacenterLocation.toLowerCase().includes(normalizedSearch) ||
        (!!region.launchYear && region.launchYear.toString().includes(normalizedSearch))

      const matchesGeography = !selectedGeography || region.regionGroup === selectedGeography

      return matchesSearch && matchesGeography
    })
  }
}
