import { Component, computed, effect, inject, input, signal } from '@angular/core'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmRegionHref,
  buildVmSeriesHref,
  buildVmSkuHref,
  VM_COMPARISON_HREF,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeLabel,
  vmPriceProfileSourceLabel,
  vmRegionHourlyPrice,
  VmSkuDetailDocument,
  VmSkuRegionPrice,
} from '../../../services/vm-catalog'
import {
  buildVmCapabilityViews,
  buildVmSkuCpuDetails,
  buildVmSkuNameSegments,
  buildVmSkuSpecs,
  formatVmHourlyPrice,
  formatVmMonthlyPrice,
  formatVmNumber,
  VM_NAME_COLLATOR,
} from '../../../services/vm-catalog-view'
import { buildDocumentHref } from '../../../shared/document-navigation'
import { ExportCsvButtonComponent } from '../../../shared/export-csv-button/export-csv-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import {
  absoluteUrl,
  BreadcrumbEntry,
  buildBreadcrumbList,
  buildSchemaNode,
} from '../../../shared/structured-data'
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

type SkuRegionPriceSort = 'arm-region' | 'price' | 'region'

interface SelectedVmSkuRegionPrice extends VmSkuRegionPrice {
  readonly hourlyPrice: number
}

const PRICE_PREMIUM_PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})
const DEFAULT_SORT_DIRECTIONS: Readonly<Record<SkuRegionPriceSort, VmPriceSortDirection>> = {
  'arm-region': 'asc',
  price: 'asc',
  region: 'asc',
}

@Component({
  selector: 'app-azure-vm-sku-details',
  imports: [
    ExportCsvButtonComponent,
    LucideIconComponent,
    VmCatalogNotice,
    VmOperatingSystemToggle,
    VmPriceModeToggle,
  ],
  templateUrl: './azure-vm-sku-details.html',
  host: { class: 'block min-w-0' },
})
export class AzureVmSkuDetails {
  readonly buildDocumentHref = buildDocumentHref
  private readonly seoService = inject(SeoService)

  readonly vmSkuPageData = input.required<VmSkuDetailDocument>()
  readonly sortKey = signal<SkuRegionPriceSort>('price')
  readonly sortDirection = signal<VmPriceSortDirection>('asc')
  readonly selectedOperatingSystem = signal<VmOperatingSystem>('Linux')
  readonly selectedPriceMode = signal<VmPriceMode>('PayAsYouGo')
  readonly sku = computed(() => this.vmSkuPageData().sku)
  readonly familySummary = computed(() => this.vmSkuPageData().familySummary)
  readonly cpuDetails = computed(() => buildVmSkuCpuDetails(this.sku()))
  readonly nameSegments = computed(() => buildVmSkuNameSegments(this.sku()))
  readonly specs = computed(() => buildVmSkuSpecs(this.sku()))
  readonly capabilities = computed(() => buildVmCapabilityViews(this.sku()))
  readonly selectedPriceModeLabel = computed(() => vmPriceModeLabel(this.selectedPriceMode()))
  readonly selectedPriceSourceLabel = computed(() =>
    vmPriceProfileSourceLabel(
      this.vmSkuPageData().source,
      this.selectedOperatingSystem(),
      this.selectedPriceMode()
    )
  )
  readonly regionPrices = computed(() => {
    const sortDirection = this.sortDirection()
    const sortKey = this.sortKey()
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    const prices = this.vmSkuPageData().prices.flatMap<SelectedVmSkuRegionPrice>((price) => {
      const hourlyPrice = vmRegionHourlyPrice(price, operatingSystem, priceMode)
      return hourlyPrice === null ? [] : [{ ...price, hourlyPrice }]
    })
    return prices.sort((left, right) => {
      switch (sortKey) {
        case 'arm-region':
          return compareVmPriceStrings(
            VM_NAME_COLLATOR,
            left.armRegionName,
            right.armRegionName,
            sortDirection
          )
        case 'region':
          return (
            compareVmPriceStrings(
              VM_NAME_COLLATOR,
              this.priceRegionName(left),
              this.priceRegionName(right),
              sortDirection
            ) || VM_NAME_COLLATOR.compare(left.armRegionName, right.armRegionName)
          )
        default:
          return (
            compareVmPriceNumbers(left.hourlyPrice, right.hourlyPrice, sortDirection) ||
            VM_NAME_COLLATOR.compare(left.armRegionName, right.armRegionName)
          )
      }
    })
  })
  readonly cheapestRegionPrice = computed<SelectedVmSkuRegionPrice | null>(() => {
    let cheapest: SelectedVmSkuRegionPrice | null = null
    for (const price of this.regionPrices()) {
      if (
        cheapest === null ||
        price.hourlyPrice < cheapest.hourlyPrice ||
        (price.hourlyPrice === cheapest.hourlyPrice &&
          VM_NAME_COLLATOR.compare(price.armRegionName, cheapest.armRegionName) < 0)
      ) {
        cheapest = price
      }
    }
    return cheapest
  })
  readonly cheapestRegionPrices = computed(() => {
    const cheapest = this.cheapestRegionPrice()
    return cheapest === null
      ? []
      : this.regionPrices().filter((price) => price.hourlyPrice === cheapest.hourlyPrice)
  })
  readonly priceCurrency = computed(() => this.vmSkuPageData().source.retailPrices.currencyCode)
  readonly comparisonQueryParams = computed(() => ({
    skus: this.sku().sku,
    os: this.selectedOperatingSystem(),
    mode: this.selectedPriceMode(),
  }))
  readonly csvFilename = computed(() => `azure-vm-${this.sku().skuKey.toLowerCase()}-region-prices`)
  readonly csvHeaders = computed(() => [
    'SKU',
    'Region',
    'ARM region',
    'Operating system',
    'Pricing model',
    'Price source',
    `Hourly (${this.priceCurrency()})`,
    `Estimated monthly (${this.priceCurrency()})`,
    'Vs. cheapest',
  ])
  readonly csvRows = computed<string[][]>(() =>
    this.regionPrices().map((price) => [
      this.sku().sku,
      price.region.displayName,
      price.armRegionName,
      this.selectedOperatingSystem(),
      this.selectedPriceModeLabel(),
      this.selectedPriceSourceLabel(),
      this.formatHourlyPrice(price.hourlyPrice),
      this.formatMonthlyPrice(price.hourlyPrice),
      this.formatPricePremium(price.hourlyPrice),
    ])
  )
  readonly hasFeatureFlags = computed(() => {
    const specs = this.specs()
    return (
      (specs.gpuCount !== null && specs.gpuCount > 0) ||
      specs.acceleratedNetworking ||
      specs.rdma ||
      specs.premiumIO
    )
  })
  readonly hasGpu = computed(() => {
    const gpuCount = this.specs().gpuCount
    return gpuCount !== null && gpuCount > 0
  })

  readonly buildVmRegionHref = buildVmRegionHref
  readonly buildVmSeriesHref = buildVmSeriesHref
  readonly buildVmSkuHref = buildVmSkuHref
  readonly comparisonHref = VM_COMPARISON_HREF
  readonly formatNumber = formatVmNumber

  constructor() {
    effect(() => {
      const data = this.vmSkuPageData()
      const sku = data.sku
      const specs = buildVmSkuSpecs(sku)
      const canonicalPath = buildVmSkuHref(sku.sku)
      const specSummary = [
        specs.vcpus === null ? '' : `${formatVmNumber(specs.vcpus)} vCPU`,
        specs.memoryGB === null ? '' : `${formatVmNumber(specs.memoryGB)} GB memory`,
        specs.architecture,
      ]
        .filter(Boolean)
        .join(', ')
      const priceSummary = data.prices.length
        ? `Compare Linux and Windows pay-as-you-go, savings plan, reserved, and Spot prices for ${sku.sku} across Azure regions.`
        : `No current Linux or Windows Retail Prices entry is available for ${sku.sku}.`
      const description = `${priceSummary}${specSummary ? ` Specifications: ${specSummary}.` : ''} View hourly regional prices and available VM size metadata.`
      const breadcrumbEntries: BreadcrumbEntry[] = [
        { name: 'Azure VM Sizes & Pricing', path: '/AzureVmPricing' },
        { name: 'Series', path: '/AzureVmPricing/Series' },
      ]
      if (data.familySummary.skuCount > 1) {
        breadcrumbEntries.push({
          name: data.familySummary.series,
          path: buildVmSeriesHref(data.familySummary.series),
        })
      }
      breadcrumbEntries.push({ name: sku.sku, path: canonicalPath })

      this.seoService.setPageMeta({
        title: `${sku.sku}: Azure VM Price, Specs and Regions`,
        description,
        canonicalUrl: absoluteUrl(canonicalPath),
        structuredData: [
          buildBreadcrumbList(breadcrumbEntries),
          buildSchemaNode('WebPage', {
            name: `${sku.sku} Azure VM pricing by region`,
            description,
            url: absoluteUrl(canonicalPath),
            about: {
              '@type': 'Thing',
              name: sku.sku,
              description: `VM size in the ${data.familySummary.series}`,
            },
          }),
        ],
      })
    })
  }

  regionAnchor(armRegionName: string): string {
    return `region-${armRegionName}`
  }

  formatHourlyPrice(price: number): string {
    return formatVmHourlyPrice(price, this.priceCurrency())
  }

  formatMonthlyPrice(price: number): string {
    return formatVmMonthlyPrice(price, this.priceCurrency())
  }

  formatPricePremium(price: number): string {
    const cheapest = this.cheapestRegionPrice()
    if (cheapest === null || cheapest.hourlyPrice <= 0) return 'N/A'
    if (price <= cheapest.hourlyPrice) return '0%'

    const premiumPercent = ((price - cheapest.hourlyPrice) / cheapest.hourlyPrice) * 100
    const formattedPremium = PRICE_PREMIUM_PERCENT_FORMATTER.format(premiumPercent)
    return formattedPremium === '0' ? '<0.01%' : `+${formattedPremium}%`
  }

  priceRegionName(price: VmSkuRegionPrice): string {
    return price.region.displayName
  }

  isCheapestRegionPrice(price: SelectedVmSkuRegionPrice): boolean {
    const cheapest = this.cheapestRegionPrice()
    return cheapest !== null && price.hourlyPrice === cheapest.hourlyPrice
  }

  updateOperatingSystem(operatingSystem: VmOperatingSystem): void {
    this.selectedOperatingSystem.set(operatingSystem)
  }

  updatePriceMode(priceMode: VmPriceMode): void {
    this.selectedPriceMode.set(priceMode)
  }

  sortBy(sortKey: SkuRegionPriceSort): void {
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

  sortAriaValue(sortKey: SkuRegionPriceSort): 'ascending' | 'descending' | null {
    return vmPriceSortAriaValue(this.sortKey(), this.sortDirection(), sortKey)
  }

  isSortedBy(sortKey: SkuRegionPriceSort): boolean {
    return this.sortKey() === sortKey
  }

  isSortAscending(): boolean {
    return this.sortDirection() === 'asc'
  }
}
