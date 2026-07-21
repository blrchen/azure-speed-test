import { Component, computed, effect, inject, input, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmRegionHref,
  buildVmSeriesHref,
  buildVmSkuHref,
  VM_COMPARISON_HREF,
  VM_PRICE_MODE_OPTIONS,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeDescription,
  vmPriceModeLabel,
  vmRegionHourlyPrice,
  VmSkuDetailDocument,
  VmSkuRegionPrice,
} from '../../../services/vm-catalog'
import {
  buildVmCapabilityViews,
  buildVmSkuSpecs,
  formatVmNumber,
  VM_NAME_COLLATOR,
} from '../../../services/vm-catalog-view'
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

type SkuRegionPriceSort = 'arm-region' | 'price' | 'region'

interface SelectedVmSkuRegionPrice extends Omit<VmSkuRegionPrice, 'hourlyPrice'> {
  readonly hourlyPrice: number
}

interface VmPriceComparisonRow {
  readonly priceMode: VmPriceMode
  readonly label: string
  readonly description: string
  readonly minHourlyPrice: number | null
  readonly cheapestLocations: readonly string[]
  readonly pricedRegionCount: number
  readonly savingsPercent: number | null
}

const MONTHLY_HOURS = 730
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
  imports: [LucideIconComponent, RouterLink, VmOperatingSystemToggle, VmPriceModeToggle],
  templateUrl: './azure-vm-sku-details.html',
  styleUrl: './azure-vm-sku-details.css',
  host: { class: 'block' },
})
export class AzureVmSkuDetails {
  private readonly seoService = inject(SeoService)

  readonly vmSkuPageData = input.required<VmSkuDetailDocument>()
  readonly sortKey = signal<SkuRegionPriceSort>('price')
  readonly sortDirection = signal<VmPriceSortDirection>('asc')
  readonly selectedOperatingSystem = signal<VmOperatingSystem>('Linux')
  readonly selectedPriceMode = signal<VmPriceMode>('PayAsYouGo')
  readonly sku = computed(() => this.vmSkuPageData().sku)
  readonly familySummary = computed(() => this.vmSkuPageData().familySummary)
  readonly specs = computed(() => buildVmSkuSpecs(this.sku()))
  readonly capabilities = computed(() => buildVmCapabilityViews(this.sku()))
  readonly selectedPriceModeLabel = computed(() => vmPriceModeLabel(this.selectedPriceMode()))
  readonly selectedPriceModeDescription = computed(() =>
    vmPriceModeDescription(this.selectedPriceMode())
  )
  readonly priceComparisonRows = computed<readonly VmPriceComparisonRow[]>(() => {
    const profiles = this.sku().priceProfiles[this.selectedOperatingSystem()]
    const paygPrice = profiles.PayAsYouGo.minHourlyPrice
    return VM_PRICE_MODE_OPTIONS.map((option) => {
      const profile = profiles[option.value]
      const savingsPercent =
        option.value === 'PayAsYouGo' ||
        profile.minHourlyPrice === null ||
        paygPrice === null ||
        profile.minHourlyPrice >= paygPrice
          ? null
          : Number((((paygPrice - profile.minHourlyPrice) / paygPrice) * 100).toFixed(1))
      return {
        priceMode: option.value,
        label: option.label,
        description: option.description,
        minHourlyPrice: profile.minHourlyPrice,
        cheapestLocations: profile.cheapestLocations,
        pricedRegionCount: profile.pricedLocations.length,
        savingsPercent,
      }
    })
  })
  readonly regionPrices = computed(() => {
    const sortDirection = this.sortDirection()
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    const prices = this.vmSkuPageData().prices.flatMap<SelectedVmSkuRegionPrice>((price) => {
      const hourlyPrice = vmRegionHourlyPrice(price, operatingSystem, priceMode)
      return hourlyPrice === null ? [] : [{ ...price, hourlyPrice }]
    })
    return prices.sort((left, right) => {
      switch (this.sortKey()) {
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
  private readonly hourlyPriceFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.priceCurrency(),
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      })
  )
  private readonly monthlyPriceFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.priceCurrency(),
        maximumFractionDigits: 2,
      })
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
        specs.architecture === 'Not listed' ? '' : specs.architecture,
      ]
        .filter(Boolean)
        .join(', ')
      const priceSummary = data.prices.length
        ? `Compare Linux and Windows pay-as-you-go, reserved, and Spot prices for ${sku.sku} across Azure regions.`
        : `No current Linux or Windows Retail Prices entry is available for ${sku.sku}.`
      const description = `${priceSummary}${specSummary ? ` Specifications: ${specSummary}.` : ''} View hourly regional prices and available VM size metadata.`
      const breadcrumbItems = [
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
        ...(data.familySummary.skuCount > 1
          ? [
              {
                '@type': 'ListItem',
                position: 3,
                name: data.familySummary.series,
                item: `https://www.azurespeed.com${buildVmSeriesHref(data.familySummary.series)}`,
              },
            ]
          : []),
      ]
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: breadcrumbItems.length + 1,
        name: sku.sku,
        item: `https://www.azurespeed.com${canonicalPath}`,
      })

      this.seoService.setPageMeta({
        title: `${sku.sku}: Azure VM Price, Specs and Regions`,
        description,
        canonicalUrl: `https://www.azurespeed.com${canonicalPath}`,
        structuredData: [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `${sku.sku} Azure VM pricing by region`,
            description,
            url: `https://www.azurespeed.com${canonicalPath}`,
            about: {
              '@type': 'Thing',
              name: sku.sku,
              description: `VM size in the ${data.familySummary.series}`,
            },
          },
        ],
      })
    })
  }

  regionAnchor(armRegionName: string): string {
    return `region-${armRegionName}`
  }

  formatHourlyPrice(price: number): string {
    return this.hourlyPriceFormatter().format(price)
  }

  formatMonthlyPrice(price: number): string {
    return this.monthlyPriceFormatter().format(price * MONTHLY_HOURS)
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

  isCheapestRegionPrice(price: VmSkuRegionPrice): boolean {
    const cheapest = this.cheapestRegionPrice()
    return cheapest !== null && price.hourlyPrice === cheapest.hourlyPrice
  }

  updateOperatingSystem(operatingSystem: VmOperatingSystem): void {
    this.selectedOperatingSystem.set(operatingSystem)
  }

  updatePriceMode(priceMode: VmPriceMode): void {
    this.selectedPriceMode.set(priceMode)
  }

  priceComparisonSavingsLabel(row: VmPriceComparisonRow): string {
    if (row.priceMode === 'PayAsYouGo') return 'Baseline'
    if (row.minHourlyPrice === null) return 'Not available'
    return row.savingsPercent === null ? 'No current savings' : `${row.savingsPercent}% lower`
  }

  priceComparisonRegionLabel(row: VmPriceComparisonRow): string {
    const [firstRegion] = row.cheapestLocations
    if (!firstRegion) return 'Not available'
    const regionalPrice = this.vmSkuPageData().prices.find(
      (price) => price.armRegionName === firstRegion
    )
    const name = regionalPrice?.region.displayName ?? firstRegion
    const tied = row.cheapestLocations.length - 1
    return tied > 0 ? `${name} +${tied}` : name
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
