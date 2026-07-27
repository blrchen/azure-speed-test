import { Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmRegionHref,
  buildVmSkuHref,
  VM_TYPE_OPTIONS,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeLabel,
  vmPriceProfileSourceLabel,
  VmRegionDetailDocument,
  vmRegionPricedRegionCount,
  VmRegionPriceSummary,
  VmRegionSkuSpecs,
  VmRegionStatus,
} from '../../../services/vm-catalog'
import {
  formatVmHourlyPrice,
  formatVmMonthlyPrice,
  formatVmNumber,
  VM_NAME_COLLATOR,
  VM_NUMBER_FORMATTER,
} from '../../../services/vm-catalog-view'
import { ExportCsvButtonComponent } from '../../../shared/export-csv-button/export-csv-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import {
  buildSearchIndex,
  buildSearchQuery,
  matchesSearchIndex,
  SearchIndex,
} from '../../../shared/search-normalization'
import { absoluteUrl, buildBreadcrumbList, buildItemList } from '../../../shared/structured-data'
import { VmCatalogNotice } from '../vm-catalog-notice/vm-catalog-notice'
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
  readonly sku: VmRegionPriceSummary
  readonly specs: VmRegionSkuSpecs
  readonly hourlyPrice: number
  readonly pricedRegionCount: number
  readonly searchIndex: SearchIndex
}

interface RegionPriceBaseView {
  readonly sku: VmRegionPriceSummary
  readonly specs: VmRegionSkuSpecs
  readonly searchIndex: SearchIndex
}

interface FamilyGroupOption {
  readonly familyGroup: string
  readonly count: number
}

const STRUCTURED_DATA_ITEM_LIMIT = 48
const INITIAL_VISIBLE_RESULT_COUNT = 100
const DEFAULT_SORT_DIRECTIONS: Readonly<Record<RegionPriceSort, VmPriceSortDirection>> = {
  memory: 'desc',
  price: 'asc',
  regions: 'desc',
  series: 'asc',
  sku: 'asc',
  vcpus: 'desc',
}

function buildPriceBaseView(sku: VmRegionPriceSummary): RegionPriceBaseView {
  const specs = sku.specs
  return {
    sku,
    specs,
    searchIndex: buildSearchIndex(
      [
        sku.sku,
        sku.size,
        sku.series,
        sku.familyGroup,
        specs.architecture,
        specs.vcpus === null ? null : `${specs.vcpus} vCPU vCPUs CPU cores`,
        specs.memoryGB === null ? null : `${specs.memoryGB} GB memory RAM`,
        specs.gpuCount === null ? null : `${specs.gpuCount} GPU GPUs`,
      ]
        .filter(Boolean)
        .join(' ')
    ),
  }
}

function buildPriceView(
  baseView: RegionPriceBaseView,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode
): RegionPriceView | null {
  const hourlyPrice = baseView.sku.hourlyPrices[operatingSystem][priceMode]
  const pricedRegionCount = vmRegionPricedRegionCount(baseView.sku, operatingSystem, priceMode)
  if (hourlyPrice === undefined || pricedRegionCount === null) return null
  return {
    ...baseView,
    hourlyPrice,
    pricedRegionCount,
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
    ExportCsvButtonComponent,
    LucideIconComponent,
    VmCatalogNotice,
    VmNumericMultiFilter,
    VmOperatingSystemToggle,
    VmPriceModeToggle,
  ],
  templateUrl: './azure-vm-region-sizes.html',
  host: { class: 'block min-w-0' },
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
  readonly showAllResults = linkedSignal({
    source: () =>
      [
        this.query(),
        this.selectedType(),
        this.selectedFamilyGroup(),
        this.selectedVcpus(),
        this.selectedVcpuRange(),
        this.selectedMemoryGB(),
        this.selectedMemoryRange(),
        this.selectedOperatingSystem(),
        this.selectedPriceMode(),
      ] as const,
    computation: () => false,
  })
  readonly region = computed(() => this.vmRegionPageData().region)
  readonly selectedPriceModeLabel = computed(() => vmPriceModeLabel(this.selectedPriceMode()))
  readonly selectedPriceSourceLabel = computed(() =>
    vmPriceProfileSourceLabel(
      this.vmRegionPageData().source,
      this.selectedOperatingSystem(),
      this.selectedPriceMode()
    )
  )
  readonly priceBaseViews = computed(() =>
    this.vmRegionPageData().prices.map((price) => buildPriceBaseView(price))
  )
  readonly priceViews = computed(() => {
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    return this.priceBaseViews().flatMap((baseView) => {
      const view = buildPriceView(baseView, operatingSystem, priceMode)
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
      if (selectedType && view.sku.typeCategory !== selectedType) continue
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
    const searchQuery = buildSearchQuery(this.query())
    const type = this.selectedType()
    const familyGroup = this.selectedFamilyGroup()
    const vcpus = this.selectedVcpus()
    const vcpuRange = this.selectedVcpuRange()
    const memoryGB = this.selectedMemoryGB()
    const memoryRange = this.selectedMemoryRange()
    const sortKey = this.sortKey()
    const sortDirection = this.sortDirection()
    const prices = this.priceViews().filter((view) => {
      if (type && view.sku.typeCategory !== type) return false
      if (familyGroup && view.sku.familyGroup !== familyGroup) return false
      if (!matchesVmNumericFilter(view.specs.vcpus, vcpus, vcpuRange)) return false
      if (!matchesVmNumericFilter(view.specs.memoryGB, memoryGB, memoryRange)) return false
      return matchesSearchIndex(view.searchIndex, searchQuery)
    })

    return [...prices].sort((left, right) => {
      switch (sortKey) {
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
  readonly visiblePrices = computed(() => {
    const filteredPrices = this.filteredPrices()
    return this.showAllResults()
      ? filteredPrices
      : filteredPrices.slice(0, INITIAL_VISIBLE_RESULT_COUNT)
  })
  readonly canToggleResultVisibility = computed(
    () => this.filteredPrices().length > INITIAL_VISIBLE_RESULT_COUNT
  )
  readonly resultSummary = computed(() => {
    const visible = this.visiblePrices().length
    const filtered = this.filteredPrices().length
    const total = this.priceViews().length
    const visibleLabel =
      visible < filtered
        ? `${VM_NUMBER_FORMATTER.format(visible)} of ${VM_NUMBER_FORMATTER.format(filtered)}`
        : `all ${VM_NUMBER_FORMATTER.format(filtered)}`
    return `Showing ${visibleLabel} matching prices (${VM_NUMBER_FORMATTER.format(total)} total)`
  })
  readonly resultVisibilityLabel = computed(() =>
    this.showAllResults()
      ? `Show first ${VM_NUMBER_FORMATTER.format(INITIAL_VISIBLE_RESULT_COUNT)} prices`
      : `Show all ${VM_NUMBER_FORMATTER.format(this.filteredPrices().length)} prices`
  )
  readonly csvFilename = computed(
    () => `azure-vm-${this.region().armRegionName.toLowerCase()}-prices`
  )
  readonly csvHeaders = computed(() => {
    const currency = this.vmRegionPageData().source.retailPrices.currencyCode
    return [
      'SKU',
      'Series',
      'Type',
      'vCPUs',
      'Memory (GB)',
      'Architecture',
      'Region',
      'ARM region',
      'Operating system',
      'Pricing model',
      'Price source',
      `Hourly (${currency})`,
      `Estimated monthly (${currency})`,
      'Priced regions',
    ]
  })
  readonly csvRows = computed<string[][]>(() =>
    this.filteredPrices().map((view) => [
      view.sku.sku,
      view.sku.series,
      view.sku.typeCategory ?? 'N/A',
      formatVmNumber(view.specs.vcpus),
      formatVmNumber(view.specs.memoryGB),
      view.specs.architecture ?? 'N/A',
      this.region().displayName,
      this.region().armRegionName,
      this.selectedOperatingSystem(),
      this.selectedPriceModeLabel(),
      this.selectedPriceSourceLabel(),
      this.formatHourlyPrice(view.hourlyPrice),
      this.formatMonthlyPrice(view.hourlyPrice),
      String(view.pricedRegionCount),
    ])
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
  readonly buildVmSkuHref = buildVmSkuHref
  readonly formatNumber = formatVmNumber

  constructor() {
    effect(() => {
      const data = this.vmRegionPageData()
      const region = data.region
      const canonicalPath = buildVmRegionHref(region.armRegionName)
      const description = `Compare Linux and Windows pay-as-you-go, savings plan, reserved, and Spot Azure VM prices in ${region.displayName} (${region.armRegionName}). Search and sort by hourly price, VM size, series, family, vCPU, memory, and architecture.`

      this.seoService.setPageMeta({
        title: `Azure VM Prices in ${region.displayName}: Linux and Windows`,
        description,
        canonicalUrl: absoluteUrl(canonicalPath),
        robots: region.indexable ? undefined : 'noindex,follow',
        structuredData: [
          buildBreadcrumbList([
            { name: 'Azure VM Sizes & Pricing', path: '/AzureVmPricing' },
            { name: 'Regions', path: '/AzureVmPricing/Regions' },
            { name: region.displayName, path: canonicalPath },
          ]),
          buildItemList({
            name: `Azure VM prices in ${region.displayName}`,
            numberOfItems: data.prices.length,
            entries: data.prices.slice(0, STRUCTURED_DATA_ITEM_LIMIT).map((price) => ({
              name: price.sku,
              path: buildVmSkuHref(price.sku, region.armRegionName),
            })),
          }),
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

  toggleResultVisibility(): void {
    this.showAllResults.update((showAll) => !showAll)
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
    return formatVmHourlyPrice(price, this.vmRegionPageData().source.retailPrices.currencyCode)
  }

  formatMonthlyPrice(price: number): string {
    return formatVmMonthlyPrice(price, this.vmRegionPageData().source.retailPrices.currencyCode)
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
