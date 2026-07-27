import { Component, computed, effect, inject, input, signal } from '@angular/core'

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
import { buildSearchPhrases, matchesSearchPhrases } from '../../../shared/search-normalization'
import { absoluteUrl, buildBreadcrumbList, buildItemList } from '../../../shared/structured-data'
import { VmCatalogNotice } from '../vm-catalog-notice/vm-catalog-notice'
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
  imports: [LucideIconComponent, VmCatalogNotice, VmOperatingSystemToggle, VmPriceModeToggle],
  templateUrl: './azure-vm-region-directory.html',
  host: { class: 'block min-w-0' },
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
    const searchPhrases = buildSearchPhrases(this.query())
    const status = this.selectedStatus()
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    const regions = this.vmRegionDirectory().regions.filter((region) => {
      if (vmRegionPricedSkuCount(region, operatingSystem, priceMode) === 0) return false
      if (status && region.status !== status) return false
      return matchesSearchPhrases(
        [
          region.armRegionName,
          region.displayName,
          region.geography,
          region.regionGroup,
          region.status,
        ].join(' '),
        searchPhrases
      )
    })

    const sortKey = this.sortKey()
    const sortDirection = this.sortDirection()
    const sorted = [...regions].sort((left, right) => {
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
            vmRegionPricedSkuCount(left, operatingSystem, priceMode),
            vmRegionPricedSkuCount(right, operatingSystem, priceMode),
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

    return sorted.map((region) => ({
      region,
      pricedSkuCount: vmRegionPricedSkuCount(region, operatingSystem, priceMode),
    }))
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
      const canonicalPath = '/AzureVmPricing/Regions'
      const description = `Compare Linux and Windows pay-as-you-go, savings plan, reserved, and Spot Azure VM prices across Azure regions. Open a region to sort VM sizes by hourly price, series, CPU, memory, family, and architecture.`

      this.seoService.setPageMeta({
        title: 'Azure VM Pricing by Region: Linux and Windows',
        description,
        canonicalUrl: absoluteUrl(canonicalPath),
        structuredData: [
          buildBreadcrumbList([
            { name: 'Azure VM Sizes & Pricing', path: '/AzureVmPricing' },
            { name: 'Regions', path: canonicalPath },
          ]),
          buildItemList({
            name: 'Azure VM pricing regions',
            numberOfItems: data.regions.length,
            entries: data.regions
              .filter((region) => region.indexable)
              .map((region) => ({
                name: `${region.displayName} Azure VM pricing`,
                path: buildVmRegionHref(region.armRegionName),
              })),
          }),
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
