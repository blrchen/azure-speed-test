import { Component, computed, effect, inject, input, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmSeriesHref,
  buildVmSkuHref,
  expandVmRegionSku,
  VmFamilyDetailDocument,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeLabel,
  vmSkuMinHourlyPrice,
  vmSkuPricedRegionCount,
  VmSkuSummary,
} from '../../../services/vm-catalog'
import {
  buildVmSkuSpecs,
  formatVmNumber,
  VM_NAME_COLLATOR,
  VmSkuSpecs,
} from '../../../services/vm-catalog-view'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { VmOperatingSystemToggle } from '../vm-operating-system-toggle/vm-operating-system-toggle'
import { VmPriceModeToggle } from '../vm-price-mode-toggle/vm-price-mode-toggle'
import {
  compareNullableVmPriceNumbers,
  compareVmPriceNumbers,
  compareVmPriceStrings,
  nextVmPriceSortDirection,
  vmPriceSortAriaValue,
  VmPriceSortDirection,
} from '../vm-pricing-table-sort'

type FamilySkuSort = 'memory' | 'price' | 'regions' | 'sku' | 'vcpus'

interface FamilySkuView {
  readonly sku: VmSkuSummary
  readonly specs: VmSkuSpecs
  readonly minHourlyPrice: number | null
  readonly pricedRegionCount: number
}

const MONTHLY_HOURS = 730
const DEFAULT_SORT_DIRECTIONS: Readonly<Record<FamilySkuSort, VmPriceSortDirection>> = {
  memory: 'desc',
  price: 'asc',
  regions: 'desc',
  sku: 'asc',
  vcpus: 'desc',
}

function compareFamilySkuViews(
  left: FamilySkuView,
  right: FamilySkuView,
  sortKey: FamilySkuSort,
  sortDirection: VmPriceSortDirection
): number {
  switch (sortKey) {
    case 'memory':
      return (
        compareNullableVmPriceNumbers(left.specs.memoryGB, right.specs.memoryGB, sortDirection) ||
        VM_NAME_COLLATOR.compare(left.sku.sku, right.sku.sku)
      )
    case 'regions':
      return (
        compareVmPriceNumbers(left.pricedRegionCount, right.pricedRegionCount, sortDirection) ||
        VM_NAME_COLLATOR.compare(left.sku.sku, right.sku.sku)
      )
    case 'sku':
      return compareVmPriceStrings(VM_NAME_COLLATOR, left.sku.sku, right.sku.sku, sortDirection)
    case 'vcpus':
      return (
        compareNullableVmPriceNumbers(left.specs.vcpus, right.specs.vcpus, sortDirection) ||
        VM_NAME_COLLATOR.compare(left.sku.sku, right.sku.sku)
      )
    default:
      return (
        compareNullableVmPriceNumbers(left.minHourlyPrice, right.minHourlyPrice, sortDirection) ||
        VM_NAME_COLLATOR.compare(left.sku.sku, right.sku.sku)
      )
  }
}

@Component({
  selector: 'app-azure-vm-family-sizes',
  imports: [LucideIconComponent, RouterLink, VmOperatingSystemToggle, VmPriceModeToggle],
  templateUrl: './azure-vm-family-sizes.html',
  styleUrl: './azure-vm-family-sizes.css',
  host: { class: 'block' },
})
export class AzureVmFamilySizes {
  private readonly seoService = inject(SeoService)

  readonly vmSeriesPageData = input.required<VmFamilyDetailDocument>()
  readonly sortKey = signal<FamilySkuSort>('price')
  readonly sortDirection = signal<VmPriceSortDirection>('asc')
  readonly selectedOperatingSystem = signal<VmOperatingSystem>('Linux')
  readonly selectedPriceMode = signal<VmPriceMode>('PayAsYouGo')
  readonly selectedPriceModeLabel = computed(() => vmPriceModeLabel(this.selectedPriceMode()))
  readonly seriesSummary = computed(() => this.vmSeriesPageData().family)
  readonly skuViews = computed<readonly FamilySkuView[]>(() => {
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    const sortKey = this.sortKey()
    const sortDirection = this.sortDirection()
    return this.vmSeriesPageData()
      .skus.map((sku) => {
        const expanded = expandVmRegionSku(sku)
        return {
          sku: expanded,
          specs: buildVmSkuSpecs(expanded),
          minHourlyPrice: vmSkuMinHourlyPrice(expanded, operatingSystem, priceMode),
          pricedRegionCount: vmSkuPricedRegionCount(expanded, operatingSystem, priceMode),
        }
      })
      .sort((left, right) => compareFamilySkuViews(left, right, sortKey, sortDirection))
  })

  readonly buildVmSkuHref = buildVmSkuHref
  readonly formatNumber = formatVmNumber
  private readonly hourlyPriceFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.vmSeriesPageData().source.retailPrices.currencyCode,
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      })
  )
  private readonly monthlyPriceFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.vmSeriesPageData().source.retailPrices.currencyCode,
        maximumFractionDigits: 2,
      })
  )

  formatMemory(value: number | null): string {
    return value === null ? 'Not listed' : `${formatVmNumber(value)} GB`
  }

  formatHourlyPrice(value: number | null): string {
    return value === null ? 'Price unavailable' : this.hourlyPriceFormatter().format(value)
  }

  formatMonthlyPrice(value: number | null): string {
    return value === null
      ? 'Price unavailable'
      : this.monthlyPriceFormatter().format(value * MONTHLY_HOURS)
  }

  updateOperatingSystem(operatingSystem: VmOperatingSystem): void {
    this.selectedOperatingSystem.set(operatingSystem)
  }

  updatePriceMode(priceMode: VmPriceMode): void {
    this.selectedPriceMode.set(priceMode)
  }

  sortBy(sortKey: FamilySkuSort): void {
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

  sortAriaValue(sortKey: FamilySkuSort): 'ascending' | 'descending' | null {
    return vmPriceSortAriaValue(this.sortKey(), this.sortDirection(), sortKey)
  }

  isSortedBy(sortKey: FamilySkuSort): boolean {
    return this.sortKey() === sortKey
  }

  isSortAscending(): boolean {
    return this.sortDirection() === 'asc'
  }

  constructor() {
    effect(() => {
      const data = this.vmSeriesPageData()
      const canonicalPath = buildVmSeriesHref(data.family.series)
      const familyContext = data.family.familyGroup ? ` in the ${data.family.familyGroup}` : ''
      const description = `Compare Linux and Windows pay-as-you-go, reserved, and Spot pricing and specifications for ${data.counts.skuCount} Azure VM sizes in the ${data.family.series}${familyContext}.`
      this.seoService.setPageMeta({
        title: `${data.family.series}: Azure VM Sizes, Prices and Specs`,
        description,
        canonicalUrl: `https://www.azurespeed.com${canonicalPath}`,
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
                name: 'Series',
                item: 'https://www.azurespeed.com/AzureVmPricing/Series',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: data.family.series,
                item: `https://www.azurespeed.com${canonicalPath}`,
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${data.family.series} Azure VM pricing and sizes`,
            description,
            url: `https://www.azurespeed.com${canonicalPath}`,
            about: {
              '@type': 'Thing',
              name: data.family.series,
              description: `Azure VM series${familyContext}`,
            },
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: data.counts.skuCount,
              itemListElement: data.skus.map((sku, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: sku.sku,
                url: `https://www.azurespeed.com${buildVmSkuHref(sku.sku)}`,
              })),
            },
          },
        ],
      })
    })
  }
}
