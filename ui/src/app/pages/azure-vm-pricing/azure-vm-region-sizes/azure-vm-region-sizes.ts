import { Component, computed, effect, inject, input, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmRegionHref,
  buildVmSkuHref,
  expandVmRegionSku,
  VM_TYPE_OPTIONS,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeDescription,
  vmPriceModeLabel,
  VmRegionDetailDocument,
  vmRegionHourlyPrice,
  VmRegionPriceSummary,
  VmRegionStatus,
  vmSkuPricedRegionCount,
  VmSkuSummary,
  vmTypeCategory,
} from '../../../services/vm-catalog'
import {
  buildVmSkuSpecs,
  formatVmNumber,
  VM_NAME_COLLATOR,
  VM_NUMBER_FORMATTER,
  VmSkuSpecs,
} from '../../../services/vm-catalog-view'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import {
  matchesVmNumericFilter,
  VM_MEMORY_QUICK_VALUES,
  VM_VCPU_QUICK_VALUES,
  VmNumericFilterOption,
  VmNumericFilterRange,
  VmNumericMultiFilter,
} from '../vm-numeric-multi-filter/vm-numeric-multi-filter'
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

type RegionPriceSort = 'memory' | 'price' | 'regions' | 'series' | 'sku' | 'vcpus'

interface RegionPriceView {
  readonly sku: VmSkuSummary
  readonly specs: VmSkuSpecs
  readonly hourlyPrice: number
  readonly pricedRegionCount: number
  readonly searchText: string
}

interface FamilyGroupOption {
  readonly familyGroup: string
  readonly count: number
}

const STRUCTURED_DATA_ITEM_LIMIT = 48
const MONTHLY_HOURS = 730
const DEFAULT_SORT_DIRECTIONS: Readonly<Record<RegionPriceSort, VmPriceSortDirection>> = {
  memory: 'desc',
  price: 'asc',
  regions: 'desc',
  series: 'asc',
  sku: 'asc',
  vcpus: 'desc',
}

function buildPriceView(
  price: VmRegionPriceSummary,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode
): RegionPriceView | null {
  const hourlyPrice = vmRegionHourlyPrice(price, operatingSystem, priceMode)
  if (hourlyPrice === null) return null
  const sku = expandVmRegionSku(price)
  const specs = buildVmSkuSpecs(sku)
  return {
    sku,
    specs,
    hourlyPrice,
    pricedRegionCount: vmSkuPricedRegionCount(sku, operatingSystem, priceMode),
    searchText: [
      sku.sku,
      sku.size,
      sku.family,
      sku.series,
      sku.familyGroup,
      specs.architecture,
      ...Object.keys(sku.coreCapabilities),
      ...Object.values(sku.coreCapabilities),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }
}

function buildNumericFilterOptions(
  views: readonly RegionPriceView[],
  selectValue: (view: RegionPriceView) => number | null
): readonly VmNumericFilterOption[] {
  const counts = new Map<number, number>()
  for (const view of views) {
    const value = selectValue(view)
    if (value === null) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return Array.from(counts, ([value, count]) => ({ value, count })).sort(
    (left, right) => left.value - right.value
  )
}

@Component({
  selector: 'app-azure-vm-region-sizes',
  imports: [
    LucideIconComponent,
    RouterLink,
    VmNumericMultiFilter,
    VmOperatingSystemToggle,
    VmPriceModeToggle,
  ],
  templateUrl: './azure-vm-region-sizes.html',
  styleUrl: './azure-vm-region-sizes.css',
  host: { class: 'block' },
})
export class AzureVmRegionSizes {
  private readonly seoService = inject(SeoService)

  readonly vmRegionPageData = input.required<VmRegionDetailDocument>()
  readonly query = signal('')
  readonly selectedType = signal('')
  readonly selectedFamilyGroup = signal('')
  readonly selectedVcpus = signal<ReadonlySet<number>>(new Set())
  readonly selectedVcpuRange = signal<VmNumericFilterRange | null>(null)
  readonly selectedMemoryGB = signal<ReadonlySet<number>>(new Set())
  readonly selectedMemoryRange = signal<VmNumericFilterRange | null>(null)
  readonly selectedOperatingSystem = signal<VmOperatingSystem>('Linux')
  readonly selectedPriceMode = signal<VmPriceMode>('PayAsYouGo')
  readonly sortKey = signal<RegionPriceSort>('price')
  readonly sortDirection = signal<VmPriceSortDirection>('asc')
  readonly region = computed(() => this.vmRegionPageData().region)
  readonly selectedPriceModeLabel = computed(() => vmPriceModeLabel(this.selectedPriceMode()))
  readonly selectedPriceModeDescription = computed(() =>
    vmPriceModeDescription(this.selectedPriceMode())
  )
  readonly priceViews = computed(() => {
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    return this.vmRegionPageData().prices.flatMap((price) => {
      const view = buildPriceView(price, operatingSystem, priceMode)
      return view ? [view] : []
    })
  })
  readonly lowestHourlyPrice = computed(() => {
    const prices = this.priceViews()
    return prices.length ? Math.min(...prices.map((view) => view.hourlyPrice)) : null
  })
  readonly pricedSkuCount = computed(() => this.priceViews().length)
  readonly seriesCount = computed(
    () => new Set(this.priceViews().map((view) => view.sku.series)).size
  )
  readonly typeOptions = VM_TYPE_OPTIONS
  readonly vcpuQuickValues = VM_VCPU_QUICK_VALUES
  readonly memoryQuickValues = VM_MEMORY_QUICK_VALUES
  readonly familyGroupOptions = computed<readonly FamilyGroupOption[]>(() => {
    const selectedType = this.selectedType()
    const counts = new Map<string, number>()
    for (const view of this.priceViews()) {
      const group = view.sku.familyGroup
      if (!group) continue
      if (selectedType && vmTypeCategory(group) !== selectedType) continue
      counts.set(group, (counts.get(group) ?? 0) + 1)
    }
    return Array.from(counts, ([familyGroup, count]) => ({ familyGroup, count })).sort(
      (left, right) => VM_NAME_COLLATOR.compare(left.familyGroup, right.familyGroup)
    )
  })
  readonly vcpuOptions = computed(() =>
    buildNumericFilterOptions(this.priceViews(), (view) => view.specs.vcpus)
  )
  readonly memoryOptions = computed(() =>
    buildNumericFilterOptions(this.priceViews(), (view) => view.specs.memoryGB)
  )
  readonly filteredPrices = computed(() => {
    const tokens = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean)
    const type = this.selectedType()
    const familyGroup = this.selectedFamilyGroup()
    const vcpus = this.selectedVcpus()
    const vcpuRange = this.selectedVcpuRange()
    const memoryGB = this.selectedMemoryGB()
    const memoryRange = this.selectedMemoryRange()
    const sortDirection = this.sortDirection()
    const prices = this.priceViews().filter((view) => {
      if (type && vmTypeCategory(view.sku.familyGroup) !== type) return false
      if (familyGroup && view.sku.familyGroup !== familyGroup) return false
      if (!matchesVmNumericFilter(view.specs.vcpus, vcpus, vcpuRange)) return false
      if (!matchesVmNumericFilter(view.specs.memoryGB, memoryGB, memoryRange)) return false
      return tokens.every((token) => view.searchText.includes(token))
    })

    return [...prices].sort((left, right) => {
      switch (this.sortKey()) {
        case 'memory':
          return (
            compareNullableVmPriceNumbers(
              left.specs.memoryGB,
              right.specs.memoryGB,
              sortDirection
            ) || VM_NAME_COLLATOR.compare(left.sku.sku, right.sku.sku)
          )
        case 'vcpus':
          return (
            compareNullableVmPriceNumbers(left.specs.vcpus, right.specs.vcpus, sortDirection) ||
            VM_NAME_COLLATOR.compare(left.sku.sku, right.sku.sku)
          )
        case 'series':
          return (
            compareVmPriceStrings(
              VM_NAME_COLLATOR,
              left.sku.series,
              right.sku.series,
              sortDirection
            ) || VM_NAME_COLLATOR.compare(left.sku.sku, right.sku.sku)
          )
        case 'regions':
          return (
            compareVmPriceNumbers(left.pricedRegionCount, right.pricedRegionCount, sortDirection) ||
            VM_NAME_COLLATOR.compare(left.sku.sku, right.sku.sku)
          )
        case 'sku':
          return compareVmPriceStrings(VM_NAME_COLLATOR, left.sku.sku, right.sku.sku, sortDirection)
        default:
          return (
            compareVmPriceNumbers(left.hourlyPrice, right.hourlyPrice, sortDirection) ||
            VM_NAME_COLLATOR.compare(left.sku.sku, right.sku.sku)
          )
      }
    })
  })
  readonly resultSummary = computed(
    () =>
      `${VM_NUMBER_FORMATTER.format(this.filteredPrices().length)} matching prices (${VM_NUMBER_FORMATTER.format(this.priceViews().length)} total)`
  )
  readonly hasActiveFilters = computed(() =>
    Boolean(
      this.query().trim() ||
      this.selectedType() ||
      this.selectedFamilyGroup() ||
      this.selectedVcpus().size > 0 ||
      this.selectedVcpuRange() !== null ||
      this.selectedMemoryGB().size > 0 ||
      this.selectedMemoryRange() !== null
    )
  )
  private readonly currencyFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.vmRegionPageData().source.retailPrices.currencyCode,
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      })
  )
  private readonly monthlyCurrencyFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.vmRegionPageData().source.retailPrices.currencyCode,
        maximumFractionDigits: 2,
      })
  )

  readonly buildVmSkuHref = buildVmSkuHref
  readonly formatNumber = formatVmNumber

  constructor() {
    effect(() => {
      const data = this.vmRegionPageData()
      const region = data.region
      const canonicalPath = buildVmRegionHref(region.armRegionName)
      const description = `Compare Linux and Windows pay-as-you-go, reserved, and Spot Azure VM prices in ${region.displayName} (${region.armRegionName}). Search and sort by hourly price, VM size, series, family, vCPU, memory, and architecture.`

      this.seoService.setPageMeta({
        title: `Azure VM Prices in ${region.displayName}: Linux and Windows`,
        description,
        canonicalUrl: `https://www.azurespeed.com${canonicalPath}`,
        robots: region.indexable ? undefined : 'noindex,follow',
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
                item: 'https://www.azurespeed.com/AzureVmPricing/Regions',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: region.displayName,
                item: `https://www.azurespeed.com${canonicalPath}`,
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `Azure VM prices in ${region.displayName}`,
            numberOfItems: data.prices.length,
            itemListElement: data.prices
              .slice(0, STRUCTURED_DATA_ITEM_LIMIT)
              .map((price, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: price.sku,
                url: `https://www.azurespeed.com${buildVmSkuHref(price.sku, region.armRegionName)}`,
              })),
          },
        ],
      })
    })
  }

  updateQuery(value: string): void {
    this.query.set(value.slice(0, 160))
  }

  updateType(value: string): void {
    this.selectedType.set(value)
    this.selectedFamilyGroup.set('')
  }

  updateFamilyGroup(value: string): void {
    this.selectedFamilyGroup.set(value)
  }

  updateVcpus(values: ReadonlySet<number>): void {
    this.selectedVcpus.set(values)
    if (values.size > 0) this.selectedVcpuRange.set(null)
  }

  updateVcpuRange(range: VmNumericFilterRange | null): void {
    this.selectedVcpuRange.set(range)
    if (range) this.selectedVcpus.set(new Set())
  }

  updateMemory(values: ReadonlySet<number>): void {
    this.selectedMemoryGB.set(values)
    if (values.size > 0) this.selectedMemoryRange.set(null)
  }

  updateMemoryRange(range: VmNumericFilterRange | null): void {
    this.selectedMemoryRange.set(range)
    if (range) this.selectedMemoryGB.set(new Set())
  }

  updateOperatingSystem(operatingSystem: VmOperatingSystem): void {
    this.selectedOperatingSystem.set(operatingSystem)
  }

  updatePriceMode(priceMode: VmPriceMode): void {
    this.selectedPriceMode.set(priceMode)
  }

  sortBy(sortKey: RegionPriceSort): void {
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

  sortAriaValue(sortKey: RegionPriceSort): 'ascending' | 'descending' | null {
    return vmPriceSortAriaValue(this.sortKey(), this.sortDirection(), sortKey)
  }

  isSortedBy(sortKey: RegionPriceSort): boolean {
    return this.sortKey() === sortKey
  }

  isSortAscending(): boolean {
    return this.sortDirection() === 'asc'
  }

  clearFilters(): void {
    this.query.set('')
    this.selectedType.set('')
    this.selectedFamilyGroup.set('')
    this.selectedVcpus.set(new Set())
    this.selectedVcpuRange.set(null)
    this.selectedMemoryGB.set(new Set())
    this.selectedMemoryRange.set(null)
  }

  formatHourlyPrice(price: number): string {
    return this.currencyFormatter().format(price)
  }

  formatMonthlyPrice(price: number): string {
    return this.monthlyCurrencyFormatter().format(price * MONTHLY_HOURS)
  }

  statusLabel(status: VmRegionStatus): string {
    switch (status) {
      case 'available':
        return 'Available region metadata'
      case 'restricted':
        return 'Restricted region metadata'
      case 'preview':
        return 'Preview region metadata'
      case 'planned':
        return 'Planned region metadata'
      default:
        return 'Unmapped region metadata'
    }
  }
}
