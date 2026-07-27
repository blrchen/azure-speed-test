import { Component, computed, effect, inject, input, signal } from '@angular/core'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmSeriesHref,
  buildVmSkuHref,
  VmFamilyDetailDocument,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeLabel,
  vmPriceProfileSourceLabel,
  vmSkuMinHourlyPrice,
  vmSkuPricedRegionCount,
  VmSkuSummary,
} from '../../../services/vm-catalog'
import {
  formatVmHourlyPrice,
  formatVmMonthlyPrice,
  formatVmNumber,
  VM_NAME_COLLATOR,
  VmSkuSpecs,
} from '../../../services/vm-catalog-view'
import { ExportCsvButtonComponent } from '../../../shared/export-csv-button/export-csv-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import {
  absoluteUrl,
  buildBreadcrumbList,
  buildListItems,
  buildSchemaNode,
} from '../../../shared/structured-data'
import { VmCatalogNotice } from '../vm-catalog-notice/vm-catalog-notice'
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
  imports: [
    ExportCsvButtonComponent,
    LucideIconComponent,
    VmCatalogNotice,
    VmOperatingSystemToggle,
    VmPriceModeToggle,
  ],
  templateUrl: './azure-vm-family-sizes.html',
  host: { class: 'block min-w-0' },
})
export class AzureVmFamilySizes {
  private readonly seoService = inject(SeoService)

  readonly vmSeriesPageData = input.required<VmFamilyDetailDocument>()
  readonly sortKey = signal<FamilySkuSort>('price')
  readonly sortDirection = signal<VmPriceSortDirection>('asc')
  readonly selectedOperatingSystem = signal<VmOperatingSystem>('Linux')
  readonly selectedPriceMode = signal<VmPriceMode>('PayAsYouGo')
  readonly selectedPriceModeLabel = computed(() => vmPriceModeLabel(this.selectedPriceMode()))
  readonly selectedPriceSourceLabel = computed(() =>
    vmPriceProfileSourceLabel(
      this.vmSeriesPageData().source,
      this.selectedOperatingSystem(),
      this.selectedPriceMode()
    )
  )
  readonly seriesSummary = computed(() => this.vmSeriesPageData().family)
  readonly skuViews = computed<readonly FamilySkuView[]>(() => {
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    const sortKey = this.sortKey()
    const sortDirection = this.sortDirection()
    return this.vmSeriesPageData()
      .skus.map((sku) => {
        return {
          sku,
          specs: sku.specs,
          minHourlyPrice: vmSkuMinHourlyPrice(sku, operatingSystem, priceMode),
          pricedRegionCount: vmSkuPricedRegionCount(sku, operatingSystem, priceMode),
        }
      })
      .sort((left, right) => compareFamilySkuViews(left, right, sortKey, sortDirection))
  })
  readonly csvFilename = computed(
    () => `azure-vm-${this.seriesSummary().routeSlug.toLowerCase()}-prices`
  )
  readonly csvHeaders = computed(() => {
    const currency = this.vmSeriesPageData().source.retailPrices.currencyCode
    return [
      'SKU',
      'Series',
      'vCPUs',
      'Memory (GB)',
      'Architecture',
      'Operating system',
      'Pricing model',
      'Price source',
      `Lowest hourly (${currency})`,
      `Estimated monthly (${currency})`,
      'Priced regions',
    ]
  })
  readonly csvRows = computed<string[][]>(() =>
    this.skuViews().map((view) => [
      view.sku.sku,
      view.sku.series,
      formatVmNumber(view.specs.vcpus),
      formatVmNumber(view.specs.memoryGB),
      view.specs.architecture ?? 'N/A',
      this.selectedOperatingSystem(),
      this.selectedPriceModeLabel(),
      this.selectedPriceSourceLabel(),
      this.formatHourlyPrice(view.minHourlyPrice),
      this.formatMonthlyPrice(view.minHourlyPrice),
      String(view.pricedRegionCount),
    ])
  )

  readonly buildVmSkuHref = buildVmSkuHref
  readonly formatNumber = formatVmNumber
  formatMemory(value: number | null): string {
    return value === null ? 'N/A' : `${formatVmNumber(value)} GB`
  }

  formatHourlyPrice(value: number | null): string {
    return formatVmHourlyPrice(value, this.vmSeriesPageData().source.retailPrices.currencyCode)
  }

  formatMonthlyPrice(value: number | null): string {
    return formatVmMonthlyPrice(value, this.vmSeriesPageData().source.retailPrices.currencyCode)
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
      const description = `Compare Linux and Windows pay-as-you-go, savings plan, reserved, and Spot pricing and specifications for ${data.counts.skuCount} Azure VM sizes in the ${data.family.series}${familyContext}.`
      this.seoService.setPageMeta({
        title: `${data.family.series}: Azure VM Sizes, Prices and Specs`,
        description,
        canonicalUrl: absoluteUrl(canonicalPath),
        structuredData: [
          buildBreadcrumbList([
            { name: 'Azure VM Sizes & Pricing', path: '/AzureVmPricing' },
            { name: 'Series', path: '/AzureVmPricing/Series' },
            { name: data.family.series, path: canonicalPath },
          ]),
          buildSchemaNode('CollectionPage', {
            name: `${data.family.series} Azure VM pricing and sizes`,
            description,
            url: absoluteUrl(canonicalPath),
            about: {
              '@type': 'Thing',
              name: data.family.series,
              description: `Azure VM series${familyContext}`,
            },
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: data.counts.skuCount,
              itemListElement: buildListItems(
                data.skus.map((sku) => ({
                  name: sku.sku,
                  path: buildVmSkuHref(sku.sku),
                }))
              ),
            },
          }),
        ],
      })
    })
  }
}
