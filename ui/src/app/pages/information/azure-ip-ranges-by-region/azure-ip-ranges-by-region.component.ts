import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core'
import { RouterModule } from '@angular/router'
import { RegionModel } from '../../../models'
import { RegionService, SeoService } from '../../../services'
import { HeroIconComponent } from '../../../shared/icons/hero-icons.imports'

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
  standalone: true,
  imports: [CommonModule, RouterModule, HeroIconComponent],
  templateUrl: './azure-ip-ranges-by-region.component.html',
  styleUrl: './azure-ip-ranges-by-region.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureIpRangesByRegionComponent implements OnInit {
  private readonly seoService = inject(SeoService)
  private readonly regionService = inject(RegionService)

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

  readonly trackByGroup = (_: number, group: RegionGroupView): string => group.key
  readonly trackByRegion = (_: number, region: RegionCard): string => region.regionId

  ngOnInit(): void {
    this.initializeSeoProperties()
    this.loadRegions()
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? ''
    this.searchTerm.set(value)
  }

  clearSearch(): void {
    this.searchTerm.set('')
  }

  private filterRegions(query: string): RegionCard[] {
    if (!query) {
      return this.regions()
    }
    return this.regions().filter((region) => region.searchText.includes(query))
  }

  private loadRegions(): void {
    const cards = this.regionService
      .getAllRegions()
      .map((region) => this.mapToRegionCard(region))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
    this.regions.set(cards)
  }

  private mapToRegionCard(region: RegionModel): RegionCard {
    const groupLabel = region.regionGroup?.trim() || 'Independent regions'
    const fragments = [
      region.displayName,
      region.regionId,
      groupLabel,
      region.geography,
      region.datacenterLocation
    ]
    return {
      regionId: region.regionId,
      displayName: region.displayName,
      regionGroup: groupLabel,
      geography: region.geography,
      datacenterLocation: region.datacenterLocation,
      serviceTagId: `AzureCloud.${region.regionId}`,
      searchText: fragments
        .filter((value): value is string => Boolean(value && value.trim()))
        .join(' ')
        .toLowerCase()
    }
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Explore Azure IP Ranges by Region')
    this.seoService.setMetaDescription(
      "Discover the comprehensive list of Azure IP ranges by region to optimize your application's network performance. Understand regional IP ranges for better resource allocation and enhanced security measures."
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureIpRangesByRegion')
  }
}
