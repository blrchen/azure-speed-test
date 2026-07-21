import { Component, computed, inject, input, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmSkuHref,
  expandVmDirectorySku,
  VM_COMPARISON_HREF,
  VM_TYPE_OPTIONS,
  VmCatalogDocument,
  vmCatalogPriceCounts,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeLabel,
  VmSkuCatalogEntry,
  vmSkuCheapestLocations,
  vmSkuMinHourlyPrice,
  vmSkuPricedLocations,
  vmTypeCategory,
} from '../../../services/vm-catalog'
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
import {
  VmPriceDisplay,
  VmPriceDisplayToggle,
} from '../vm-price-display-toggle/vm-price-display-toggle'
import { VmPriceModeToggle } from '../vm-price-mode-toggle/vm-price-mode-toggle'
import {
  compareNullableVmPriceNumbers,
  compareVmPriceNumbers,
  compareVmPriceStrings,
  nextVmPriceSortDirection,
  vmPriceSortAriaValue,
  VmPriceSortDirection,
} from '../vm-pricing-table-sort'

type FeatureFilter = '' | 'accelerated-networking' | 'gpu' | 'premium-io' | 'rdma'
type SortKey = 'memory' | 'price' | 'regions' | 'series' | 'sku' | 'vcpus'

interface FilterOption {
  readonly value: string
  readonly label: string
  readonly count: number
}

interface VmSkuView {
  readonly entry: VmSkuCatalogEntry
  readonly architecture: string
  readonly acceleratedNetworking: boolean
  readonly gpuCount: number | null
  readonly hasGpu: boolean
  readonly maxDataDisks: number | null
  readonly maxNetworkInterfaces: number | null
  readonly memoryGB: number | null
  readonly premiumIO: boolean
  readonly pricedLocations: readonly string[]
  readonly minHourlyPrice: number | null
  readonly cheapestLocations: readonly string[]
  readonly rdma: boolean
  readonly searchText: string
  readonly vcpus: number | null
}

const STRUCTURED_DATA_ITEM_LIMIT = 36
const MONTHLY_HOURS = 730
const NAME_COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')
const FEATURE_OPTIONS: readonly FilterOption[] = [
  { value: 'gpu', label: 'GPU', count: 0 },
  { value: 'accelerated-networking', label: 'Accelerated networking', count: 0 },
  { value: 'rdma', label: 'RDMA', count: 0 },
  { value: 'premium-io', label: 'Premium storage', count: 0 },
]
const DEFAULT_SORT_DIRECTIONS: Readonly<Record<SortKey, VmPriceSortDirection>> = {
  memory: 'desc',
  price: 'asc',
  regions: 'desc',
  series: 'asc',
  sku: 'asc',
  vcpus: 'desc',
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase()
}

function numericCapability(entry: VmSkuCatalogEntry, name: string): number | null {
  const value = Number(entry.coreCapabilities[name])
  return Number.isFinite(value) ? value : null
}

function booleanCapability(entry: VmSkuCatalogEntry, name: string): boolean {
  return entry.coreCapabilities[name]?.toLowerCase() === 'true'
}

function buildSkuView(
  entry: VmSkuCatalogEntry,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode
): VmSkuView {
  const architecture = entry.coreCapabilities['CpuArchitectureType'] ?? 'Not listed'
  const gpuCount = numericCapability(entry, 'GPUs')
  const pricedLocations = vmSkuPricedLocations(entry, operatingSystem, priceMode)

  return {
    entry,
    architecture,
    acceleratedNetworking: booleanCapability(entry, 'AcceleratedNetworkingEnabled'),
    gpuCount,
    hasGpu: gpuCount !== null && gpuCount > 0,
    maxDataDisks: numericCapability(entry, 'MaxDataDiskCount'),
    maxNetworkInterfaces: numericCapability(entry, 'MaxNetworkInterfaces'),
    memoryGB: numericCapability(entry, 'MemoryGB'),
    premiumIO: booleanCapability(entry, 'PremiumIO'),
    pricedLocations,
    minHourlyPrice: vmSkuMinHourlyPrice(entry, operatingSystem, priceMode),
    cheapestLocations: vmSkuCheapestLocations(entry, operatingSystem, priceMode),
    rdma: booleanCapability(entry, 'RdmaEnabled'),
    searchText: normalizeSearch(
      [
        entry.sku,
        entry.size,
        entry.series,
        ...entry.observedLocations,
        ...pricedLocations,
        ...Object.keys(entry.coreCapabilities),
        ...Object.values(entry.coreCapabilities),
      ].join(' ')
    ),
    vcpus: numericCapability(entry, 'vCPUs'),
  }
}

function buildOptions(values: readonly string[]): readonly FilterOption[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return Array.from(counts, ([value, count]) => ({ value, label: value, count })).sort((a, b) =>
    NAME_COLLATOR.compare(a.label, b.label)
  )
}

function buildNumericOptions(values: readonly (number | null)[]): readonly VmNumericFilterOption[] {
  const counts = new Map<number, number>()
  for (const value of values) {
    if (value !== null) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return Array.from(counts, ([value, count]) => ({ value, count })).sort(
    (left, right) => left.value - right.value
  )
}

@Component({
  selector: 'app-azure-vm-sizes',
  imports: [
    LucideIconComponent,
    RouterLink,
    VmNumericMultiFilter,
    VmOperatingSystemToggle,
    VmPriceDisplayToggle,
    VmPriceModeToggle,
  ],
  templateUrl: './azure-vm-sizes.html',
  styleUrl: './azure-vm-sizes.css',
  host: { class: 'block' },
})
export class AzureVmSizes implements OnInit {
  private readonly seoService = inject(SeoService)

  readonly vmCatalog = input.required<VmCatalogDocument>()

  readonly query = signal('')
  readonly selectedType = signal('')
  readonly selectedSeries = signal('')
  readonly selectedRegion = signal('')
  readonly selectedArchitecture = signal('')
  readonly selectedFeature = signal<FeatureFilter>('')
  readonly selectedVcpus = signal<ReadonlySet<number>>(new Set())
  readonly selectedVcpuRange = signal<VmNumericFilterRange | null>(null)
  readonly selectedMemoryGB = signal<ReadonlySet<number>>(new Set())
  readonly selectedMemoryRange = signal<VmNumericFilterRange | null>(null)
  readonly selectedOperatingSystem = signal<VmOperatingSystem>('Linux')
  readonly selectedPriceMode = signal<VmPriceMode>('PayAsYouGo')
  readonly selectedPriceDisplay = signal<VmPriceDisplay>('hourly')
  readonly selectedComparisonSkuNames = signal<readonly string[]>([])
  readonly sortKey = signal<SortKey>('price')
  readonly sortDirection = signal<VmPriceSortDirection>('asc')
  readonly typeOptions = VM_TYPE_OPTIONS
  readonly featureOptions = FEATURE_OPTIONS
  readonly vcpuQuickValues = VM_VCPU_QUICK_VALUES
  readonly memoryQuickValues = VM_MEMORY_QUICK_VALUES

  readonly catalog = computed(() => this.vmCatalog())
  readonly priceCounts = computed(() =>
    vmCatalogPriceCounts(
      this.catalog().counts,
      this.selectedOperatingSystem(),
      this.selectedPriceMode()
    )
  )
  readonly selectedPriceModeLabel = computed(() => vmPriceModeLabel(this.selectedPriceMode()))
  readonly skuViews = computed(() => {
    const catalog = this.catalog()
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    return catalog.skus.map((sku) =>
      buildSkuView(expandVmDirectorySku(sku, catalog.regions), operatingSystem, priceMode)
    )
  })
  readonly seriesOptions = computed(() =>
    buildOptions(
      this.skuViews()
        .map((sku) => sku.entry.series)
        .filter(Boolean)
    )
  )
  readonly regionOptions = computed(() =>
    buildOptions(this.skuViews().flatMap((sku) => sku.pricedLocations))
  )
  readonly architectureOptions = computed(() =>
    buildOptions(
      this.skuViews()
        .map((sku) => sku.architecture)
        .filter(Boolean)
    )
  )
  readonly vcpusOptions = computed(() =>
    buildNumericOptions(this.skuViews().map((sku) => sku.vcpus))
  )
  readonly memoryOptions = computed(() =>
    buildNumericOptions(this.skuViews().map((sku) => sku.memoryGB))
  )
  readonly comparisonQueryParams = computed(() => ({
    skus: this.selectedComparisonSkuNames().join(','),
    os: this.selectedOperatingSystem(),
    mode: this.selectedPriceMode(),
    region: this.selectedRegion() || null,
  }))
  readonly comparisonReady = computed(() => this.selectedComparisonSkuNames().length >= 2)
  readonly comparisonFull = computed(() => this.selectedComparisonSkuNames().length >= 3)

  readonly filteredSkus = computed(() => {
    const searchTokens = normalizeSearch(this.query()).split(/\s+/).filter(Boolean)
    const type = this.selectedType()
    const series = this.selectedSeries()
    const region = this.selectedRegion()
    const architecture = this.selectedArchitecture()
    const feature = this.selectedFeature()
    const vcpus = this.selectedVcpus()
    const vcpuRange = this.selectedVcpuRange()
    const memoryGB = this.selectedMemoryGB()
    const memoryRange = this.selectedMemoryRange()
    const sortKey = this.sortKey()
    const sortDirection = this.sortDirection()

    const filtered = this.skuViews().filter((sku) => {
      if (searchTokens.some((token) => !sku.searchText.includes(token))) return false
      if (type && vmTypeCategory(sku.entry.familyGroup) !== type) return false
      if (series && sku.entry.series !== series) return false
      if (region && !sku.pricedLocations.includes(region)) return false
      if (architecture && sku.architecture !== architecture) return false
      if (!matchesVmNumericFilter(sku.vcpus, vcpus, vcpuRange)) return false
      if (!matchesVmNumericFilter(sku.memoryGB, memoryGB, memoryRange)) return false

      switch (feature) {
        case 'accelerated-networking':
          return sku.acceleratedNetworking
        case 'gpu':
          return sku.hasGpu
        case 'premium-io':
          return sku.premiumIO
        case 'rdma':
          return sku.rdma
        default:
          return true
      }
    })

    return [...filtered].sort((left, right) => {
      switch (sortKey) {
        case 'series':
          return (
            compareVmPriceStrings(
              NAME_COLLATOR,
              left.entry.series,
              right.entry.series,
              sortDirection
            ) || NAME_COLLATOR.compare(left.entry.sku, right.entry.sku)
          )
        case 'memory':
          return (
            compareNullableVmPriceNumbers(left.memoryGB, right.memoryGB, sortDirection) ||
            NAME_COLLATOR.compare(left.entry.sku, right.entry.sku)
          )
        case 'regions':
          return (
            compareVmPriceNumbers(
              left.pricedLocations.length,
              right.pricedLocations.length,
              sortDirection
            ) || NAME_COLLATOR.compare(left.entry.sku, right.entry.sku)
          )
        case 'price':
          return (
            compareNullableVmPriceNumbers(
              left.minHourlyPrice,
              right.minHourlyPrice,
              sortDirection
            ) || NAME_COLLATOR.compare(left.entry.sku, right.entry.sku)
          )
        case 'vcpus':
          return (
            compareNullableVmPriceNumbers(left.vcpus, right.vcpus, sortDirection) ||
            NAME_COLLATOR.compare(left.entry.sku, right.entry.sku)
          )
        default:
          return compareVmPriceStrings(
            NAME_COLLATOR,
            left.entry.sku,
            right.entry.sku,
            sortDirection
          )
      }
    })
  })

  readonly hasActiveFilters = computed(() =>
    Boolean(
      this.query().trim() ||
      this.selectedType() ||
      this.selectedSeries() ||
      this.selectedRegion() ||
      this.selectedArchitecture() ||
      this.selectedFeature() ||
      this.selectedVcpus().size > 0 ||
      this.selectedVcpuRange() !== null ||
      this.selectedMemoryGB().size > 0 ||
      this.selectedMemoryRange() !== null
    )
  )
  readonly resultSummary = computed(() => {
    const filtered = this.filteredSkus().length
    const total = this.skuViews().length
    return `${NUMBER_FORMATTER.format(filtered)} matching VM sizes (${NUMBER_FORMATTER.format(total)} total)`
  })
  private readonly hourlyPriceFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.catalog().source.retailPrices.currencyCode,
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      })
  )
  private readonly monthlyPriceFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.catalog().source.retailPrices.currencyCode,
        maximumFractionDigits: 2,
      })
  )
  ngOnInit(): void {
    const catalog = this.vmCatalog()
    this.seoService.setPageMeta({
      title: 'Azure VM Sizes & Pricing',
      description:
        'Compare Azure VM sizes, specifications, vCPU, memory, and architecture with Linux and Windows pay-as-you-go, reserved, and Spot hourly and monthly prices.',
      canonicalUrl: 'https://www.azurespeed.com/AzureVmPricing',
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Azure resources',
              item: 'https://www.azurespeed.com/Information/AzureRegions',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Azure VM Sizes & Pricing',
              item: 'https://www.azurespeed.com/AzureVmPricing',
            },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: 'Azure VM Sizes & Pricing',
          description:
            'Azure VM sizes, hardware specifications, and Linux and Windows pay-as-you-go, reserved, and Spot retail pricing with regional price coverage.',
          url: 'https://www.azurespeed.com/AzureVmPricing',
          measurementTechnique: 'Azure Retail Prices API and Azure Resource SKUs API',
          variableMeasured: [
            'Hourly retail price',
            'Azure region',
            'VM size',
            'VM series',
            'VM family',
            'capability',
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Azure VM prices',
          numberOfItems: catalog.counts.skuCount,
          itemListElement: catalog.skus.slice(0, STRUCTURED_DATA_ITEM_LIMIT).map((sku, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: sku.sku,
            url: `https://www.azurespeed.com${buildVmSkuHref(sku.sku)}`,
          })),
        },
      ],
    })
  }

  updateQuery(value: string): void {
    this.query.set(value.slice(0, 160))
  }

  updateType(value: string): void {
    this.selectedType.set(value)
  }

  updateSeries(value: string): void {
    this.selectedSeries.set(value)
  }

  updateRegion(value: string): void {
    this.selectedRegion.set(value)
  }

  updateArchitecture(value: string): void {
    this.selectedArchitecture.set(value)
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

  updateFeature(value: string): void {
    const normalized: FeatureFilter = FEATURE_OPTIONS.some((option) => option.value === value)
      ? (value as FeatureFilter)
      : ''
    this.selectedFeature.set(normalized)
  }

  updateOperatingSystem(operatingSystem: VmOperatingSystem): void {
    this.selectedOperatingSystem.set(operatingSystem)
  }

  updatePriceMode(priceMode: VmPriceMode): void {
    this.selectedPriceMode.set(priceMode)
  }

  updatePriceDisplay(display: VmPriceDisplay): void {
    this.selectedPriceDisplay.set(display)
  }

  updateComparisonSelection(skuName: string, selected: boolean): void {
    this.selectedComparisonSkuNames.update((current) => {
      const alreadySelected = current.includes(skuName)
      if (!selected) return current.filter((currentSkuName) => currentSkuName !== skuName)
      if (alreadySelected || current.length >= 3) return current
      return [...current, skuName]
    })
  }

  removeComparisonSku(skuName: string): void {
    this.updateComparisonSelection(skuName, false)
  }

  clearComparisonSelection(): void {
    this.selectedComparisonSkuNames.set([])
  }

  isComparisonSelected(skuName: string): boolean {
    return this.selectedComparisonSkuNames().includes(skuName)
  }

  sortBy(sortKey: SortKey): void {
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

  sortAriaValue(sortKey: SortKey): 'ascending' | 'descending' | null {
    return vmPriceSortAriaValue(this.sortKey(), this.sortDirection(), sortKey)
  }

  isSortedBy(sortKey: SortKey): boolean {
    return this.sortKey() === sortKey
  }

  isSortAscending(): boolean {
    return this.sortDirection() === 'asc'
  }

  clearFilters(): void {
    this.query.set('')
    this.selectedType.set('')
    this.selectedSeries.set('')
    this.selectedRegion.set('')
    this.selectedArchitecture.set('')
    this.selectedFeature.set('')
    this.selectedVcpus.set(new Set())
    this.selectedVcpuRange.set(null)
    this.selectedMemoryGB.set(new Set())
    this.selectedMemoryRange.set(null)
  }

  formatNumber(value: number | null): string {
    return value === null ? 'Not listed' : NUMBER_FORMATTER.format(value)
  }

  formatHourlyPrice(value: number | null): string {
    return value === null ? 'Price unavailable' : this.hourlyPriceFormatter().format(value)
  }

  formatMonthlyPrice(value: number | null): string {
    return value === null
      ? 'Price unavailable'
      : this.monthlyPriceFormatter().format(value * MONTHLY_HOURS)
  }

  cheapestRegionLabel(view: VmSkuView): string {
    if (!view.cheapestLocations.length) return 'Not available'
    return view.cheapestLocations.join(', ')
  }

  readonly buildVmSkuHref = buildVmSkuHref
  readonly comparisonHref = VM_COMPARISON_HREF
}
