import { Component, computed, effect, inject, input, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmRegionHref,
  vmCatalogPriceCounts,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeLabel,
  vmRegionPricedSkuCount,
  VmRegionsDocument,
  VmRegionStatus,
} from '../../../services/vm-catalog'
import { VM_NAME_COLLATOR, VM_NUMBER_FORMATTER } from '../../../services/vm-catalog-view'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { VmOperatingSystemToggle } from '../vm-operating-system-toggle/vm-operating-system-toggle'
import { VmPriceModeToggle } from '../vm-price-mode-toggle/vm-price-mode-toggle'
import {
  compareVmPriceNumbers,
  compareVmPriceStrings,
  nextVmPriceSortDirection,
  vmPriceSortAriaValue,
  VmPriceSortDirection,
} from '../vm-pricing-table-sort'

type RegionSort = 'arm-region' | 'geography' | 'name' | 'region-group' | 'sku-count' | 'status'

const DEFAULT_SORT_DIRECTIONS: Readonly<Record<RegionSort, VmPriceSortDirection>> = {
  'arm-region': 'asc',
  geography: 'asc',
  name: 'asc',
  'region-group': 'asc',
  'sku-count': 'desc',
  status: 'asc',
}

@Component({
  selector: 'app-azure-vm-region-directory',
  imports: [LucideIconComponent, RouterLink, VmOperatingSystemToggle, VmPriceModeToggle],
  templateUrl: './azure-vm-region-directory.html',
  styleUrl: './azure-vm-region-directory.css',
  host: { class: 'block' },
})
export class AzureVmRegionDirectory {
  private readonly seoService = inject(SeoService)

  readonly vmRegionDirectory = input.required<VmRegionsDocument>()
  readonly query = signal('')
  readonly selectedStatus = signal<VmRegionStatus | ''>('')
  readonly selectedOperatingSystem = signal<VmOperatingSystem>('Linux')
  readonly selectedPriceMode = signal<VmPriceMode>('PayAsYouGo')
  readonly sortKey = signal<RegionSort>('name')
  readonly sortDirection = signal<VmPriceSortDirection>('asc')
  readonly priceCounts = computed(() =>
    vmCatalogPriceCounts(
      this.vmRegionDirectory().counts,
      this.selectedOperatingSystem(),
      this.selectedPriceMode()
    )
  )
  readonly selectedPriceModeLabel = computed(() => vmPriceModeLabel(this.selectedPriceMode()))
  readonly statusOptions = computed(() => {
    const counts = new Map<VmRegionStatus, number>()
    for (const region of this.vmRegionDirectory().regions) {
      counts.set(region.status, (counts.get(region.status) ?? 0) + 1)
    }
    return Array.from(counts, ([status, count]) => ({ status, count })).sort((left, right) =>
      VM_NAME_COLLATOR.compare(this.statusLabel(left.status), this.statusLabel(right.status))
    )
  })
  readonly filteredRegions = computed(() => {
    const query = this.query().trim().toLowerCase()
    const status = this.selectedStatus()
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    const regions = this.vmRegionDirectory().regions.filter((region) => {
      if (vmRegionPricedSkuCount(region, operatingSystem, priceMode) === 0) return false
      if (status && region.status !== status) return false
      if (!query) return true
      return [
        region.armRegionName,
        region.displayName,
        region.geography,
        region.regionGroup,
        region.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })

    const sortKey = this.sortKey()
    const sortDirection = this.sortDirection()
    return [...regions].sort((left, right) => {
      let comparison: number
      switch (sortKey) {
        case 'arm-region':
          comparison = compareVmPriceStrings(
            VM_NAME_COLLATOR,
            left.armRegionName,
            right.armRegionName,
            sortDirection
          )
          break
        case 'geography':
          comparison = compareVmPriceStrings(
            VM_NAME_COLLATOR,
            left.geography,
            right.geography,
            sortDirection
          )
          break
        case 'region-group':
          comparison = compareVmPriceStrings(
            VM_NAME_COLLATOR,
            left.regionGroup,
            right.regionGroup,
            sortDirection
          )
          break
        case 'sku-count':
          comparison = compareVmPriceNumbers(
            vmRegionPricedSkuCount(left, this.selectedOperatingSystem(), this.selectedPriceMode()),
            vmRegionPricedSkuCount(right, this.selectedOperatingSystem(), this.selectedPriceMode()),
            sortDirection
          )
          break
        case 'status':
          comparison = compareVmPriceStrings(
            VM_NAME_COLLATOR,
            this.statusLabel(left.status),
            this.statusLabel(right.status),
            sortDirection
          )
          break
        default:
          comparison = compareVmPriceStrings(
            VM_NAME_COLLATOR,
            left.displayName,
            right.displayName,
            sortDirection
          )
      }
      return comparison || VM_NAME_COLLATOR.compare(left.displayName, right.displayName)
    })
  })
  readonly resultSummary = computed(
    () =>
      `${VM_NUMBER_FORMATTER.format(this.filteredRegions().length)} of ${VM_NUMBER_FORMATTER.format(this.priceCounts().pricedRegionCount)} pricing regions`
  )

  readonly buildVmRegionHref = buildVmRegionHref
  readonly formatNumber = VM_NUMBER_FORMATTER.format.bind(VM_NUMBER_FORMATTER)

  constructor() {
    effect(() => {
      const data = this.vmRegionDirectory()
      const canonicalUrl = 'https://www.azurespeed.com/AzureVmPricing/Regions'
      const description = `Compare Linux and Windows pay-as-you-go, reserved, and Spot Azure VM prices across Azure regions. Open a region to sort VM sizes by hourly price, series, CPU, memory, family, and architecture.`

      this.seoService.setPageMeta({
        title: 'Azure VM Pricing by Region: Linux and Windows',
        description,
        canonicalUrl,
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Azure VM Sizes & Pricing',
                item: 'https://www.azurespeed.com/AzureVmPricing',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Regions',
                item: canonicalUrl,
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Azure VM pricing regions',
            numberOfItems: data.regions.length,
            itemListElement: data.regions
              .filter((region) => region.indexable)
              .map((region, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: `${region.displayName} Azure VM pricing`,
                url: `https://www.azurespeed.com${buildVmRegionHref(region.armRegionName)}`,
              })),
          },
        ],
      })
    })
  }

  updateStatus(value: string): void {
    const statuses: readonly VmRegionStatus[] = [
      'available',
      'planned',
      'preview',
      'restricted',
      'unmapped',
    ]
    this.selectedStatus.set(
      statuses.includes(value as VmRegionStatus) ? (value as VmRegionStatus) : ''
    )
  }

  updateOperatingSystem(operatingSystem: VmOperatingSystem): void {
    this.selectedOperatingSystem.set(operatingSystem)
  }

  updatePriceMode(priceMode: VmPriceMode): void {
    this.selectedPriceMode.set(priceMode)
  }

  pricedSkuCount(region: VmRegionsDocument['regions'][number]): number {
    return vmRegionPricedSkuCount(region, this.selectedOperatingSystem(), this.selectedPriceMode())
  }

  sortBy(sortKey: RegionSort): void {
    this.sortDirection.set(
      nextVmPriceSortDirection(
        this.sortKey(),
        this.sortDirection(),
        sortKey,
        DEFAULT_SORT_DIRECTIONS[sortKey]
      )
    )
    this.sortKey.set(sortKey)
  }

  sortAriaValue(sortKey: RegionSort): 'ascending' | 'descending' | null {
    return vmPriceSortAriaValue(this.sortKey(), this.sortDirection(), sortKey)
  }

  isSortedBy(sortKey: RegionSort): boolean {
    return this.sortKey() === sortKey
  }

  isSortAscending(): boolean {
    return this.sortDirection() === 'asc'
  }

  clearFilters(): void {
    this.query.set('')
    this.selectedStatus.set('')
  }

  statusLabel(status: VmRegionStatus): string {
    switch (status) {
      case 'available':
        return 'Available'
      case 'restricted':
        return 'Restricted'
      case 'preview':
        return 'Preview'
      case 'planned':
        return 'Planned'
      default:
        return 'Unmapped'
    }
  }
}
