import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { REGION_IP_RANGE_DIRECTORY, RegionIpRangeEntry } from './region-ip-ranges.data'

interface RegionCard {
  regionId: string
  displayName: string
  regionGroup: string
  geography: string
  datacenterLocation: string
  serviceTagId: string
  searchText: string
}

interface RegionGroupView {
  key: string
  label: string
  regions: RegionCard[]
}

@Component({
  selector: 'app-azure-ip-ranges-by-region',
  imports: [RouterLink, LucideIconComponent],
  templateUrl: './azure-ip-ranges-by-region.component.html',
  styleUrl: './azure-ip-ranges-by-region.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()'
  }
})
export class AzureIpRangesByRegionComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  private readonly regions = signal<RegionCard[]>([])
  readonly searchTerm = signal('')

  readonly groupedRegions = computed<RegionGroupView[]>(() => {
    const query = this.searchTerm().trim().toLowerCase()
    const matches = this.filterRegions(query)
    const groups = new Map<string, RegionCard[]>()

    for (const region of matches) {
      const key = region.regionGroup
      const current = groups.get(key)
      if (current) {
        current.push(region)
      } else {
        groups.set(key, [region])
      }
    }

    return Array.from(groups.entries())
      .map(([key, items]) => ({
        key,
        label: key,
        regions: items.slice().sort((a, b) => a.displayName.localeCompare(b.displayName))
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  readonly totalRegionCount = computed(() => this.regions().length)
  readonly filteredRegionCount = computed(() =>
    this.groupedRegions().reduce((total, group) => total + group.regions.length, 0)
  )

  ngOnInit(): void {
    this.seoService.setMetaTitle('Explore Azure IP Ranges by Region')
    this.seoService.setMetaDescription(
      "Discover the comprehensive list of Azure IP ranges by region to optimize your application's network performance. Understand regional IP ranges for better resource allocation and enhanced security measures."
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureIpRangesByRegion')
    this.loadRegions()
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? ''
    this.searchTerm.set(value)
  }

  clearSearch(): void {
    this.searchTerm.set('')
  }

  onEscape(): void {
    if (this.searchTerm()) {
      this.clearSearch()
    }
  }

  private filterRegions(query: string): RegionCard[] {
    if (!query) {
      return this.regions()
    }
    return this.regions().filter((region) => region.searchText.includes(query))
  }

  private loadRegions(): void {
    const cards = REGION_IP_RANGE_DIRECTORY.map((region) => this.mapToRegionCard(region)).sort(
      (a, b) => a.displayName.localeCompare(b.displayName)
    )
    this.regions.set(cards)
  }

  private mapToRegionCard(region: RegionIpRangeEntry): RegionCard {
    const groupLabel = region.regionGroup?.trim() || 'Independent regions'
    const location = region.datacenterLocation?.trim() ?? ''
    const fragments = [
      region.displayName,
      region.regionId,
      groupLabel,
      region.geography,
      location,
      region.serviceTagId
    ]
    return {
      regionId: region.regionId,
      displayName: region.displayName,
      regionGroup: groupLabel,
      geography: region.geography,
      datacenterLocation: location,
      serviceTagId: region.serviceTagId,
      searchText: fragments
        .filter((value): value is string => Boolean(value && value.trim()))
        .join(' ')
        .toLowerCase()
    }
  }
}
