import { Component, computed, inject, input, linkedSignal, OnInit, signal } from '@angular/core'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmSkuHref,
  VM_COMPARISON_HREF,
  VM_TYPE_OPTIONS,
  VmCatalogDocument,
  vmCatalogPriceCounts,
  VmDirectoryPriceProfile,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeLabel,
  vmPriceProfileSourceLabel,
  VmSkuDirectoryEntry,
} from '../../../services/vm-catalog'
import {
  formatVmHourlyPrice,
  formatVmMonthlyPrice,
  formatVmNumber,
  VM_NAME_COLLATOR,
  VM_NUMBER_FORMATTER,
} from '../../../services/vm-catalog-view'
import { buildDocumentHref } from '../../../shared/document-navigation'
import { ExportCsvButtonComponent } from '../../../shared/export-csv-button/export-csv-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import {
  buildSearchIndex,
  buildSearchQuery,
  matchesSearchIndex,
  SearchIndex,
} from '../../../shared/search-normalization'
import {
  absoluteUrl,
  buildBreadcrumbList,
  buildDataset,
  buildFaqPage,
  buildItemList,
} from '../../../shared/structured-data'
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

type FeatureFilter =
  | ''
  | 'accelerated-networking'
  | 'confidential-computing'
  | 'confidential-snp'
  | 'confidential-tdx'
  | 'gpu'
  | 'no-temp-disk'
  | 'premium-io'
  | 'rdma'
  | 'temp-disk'
type SortKey = 'memory' | 'price' | 'regions' | 'series' | 'sku' | 'vcpus'

interface FilterOption {
  readonly value: string
  readonly label: string
  readonly count: number
}

interface VmSkuBaseView {
  readonly entry: VmSkuDirectoryEntry
  readonly architecture: string
  readonly acceleratedNetworking: boolean
  readonly confidentialComputingType: string | null
  readonly gpuCount: number | null
  readonly hasGpu: boolean
  readonly hasTempDisk: boolean
  readonly maxDataDisks: number | null
  readonly maxNetworkInterfaces: number | null
  readonly memoryGB: number | null
  readonly premiumIO: boolean
  readonly rdma: boolean
  readonly searchIndex: SearchIndex
  readonly vcpus: number | null
}

interface VmSkuView extends VmSkuBaseView {
  readonly pricedRegionIndexes: readonly number[]
  readonly minHourlyPrice: number | null
  readonly cheapestRegionIndexes: readonly number[]
}

interface VisibleVmSkuView extends VmSkuView {
  readonly cheapestRegionLabel: string
}

const STRUCTURED_DATA_ITEM_LIMIT = 36
const INITIAL_VISIBLE_RESULT_COUNT = 100
const VM_PRICING_SOURCE_FAQ = {
  question: 'Where do VM prices and specifications come from?',
  answer:
    'Direct rates come from the Azure Retail Prices API, while VM specifications come from Azure Resource SKUs data. Azure reservations and savings plans discount eligible VM infrastructure, while Windows software charges remain separate. Windows commitment rates are labeled as estimates derived from the corresponding Linux commitment rate plus the Windows pay-as-you-go software surcharge. Public pricing does not guarantee quota, capacity, or deployment eligibility.',
} as const
const FEATURE_OPTIONS: readonly FilterOption[] = [
  { value: 'gpu', label: 'GPU', count: 0 },
  { value: 'accelerated-networking', label: 'Accelerated networking', count: 0 },
  { value: 'rdma', label: 'RDMA', count: 0 },
  { value: 'premium-io', label: 'Premium storage', count: 0 },
  { value: 'confidential-computing', label: 'Confidential computing', count: 0 },
  { value: 'confidential-snp', label: 'Confidential computing: AMD SEV-SNP', count: 0 },
  { value: 'confidential-tdx', label: 'Confidential computing: Intel TDX', count: 0 },
  { value: 'temp-disk', label: 'Local temporary disk', count: 0 },
  { value: 'no-temp-disk', label: 'No local temporary disk', count: 0 },
]
const DEFAULT_SORT_DIRECTIONS: Readonly<Record<SortKey, VmPriceSortDirection>> = {
  memory: 'desc',
  price: 'asc',
  regions: 'desc',
  series: 'asc',
  sku: 'asc',
  vcpus: 'desc',
}

function buildSkuBaseView(entry: VmSkuDirectoryEntry): VmSkuBaseView {
  const specs = entry.specs
  const gpuCount = specs.gpuCount
  return {
    entry,
    architecture: specs.architecture ?? 'N/A',
    acceleratedNetworking: specs.acceleratedNetworking,
    confidentialComputingType: specs.confidentialComputingType,
    gpuCount,
    hasGpu: gpuCount !== null && gpuCount > 0,
    hasTempDisk: specs.hasTempDisk,
    maxDataDisks: specs.maxDataDisks,
    maxNetworkInterfaces: specs.maxNetworkInterfaces,
    memoryGB: specs.memoryGB,
    premiumIO: specs.premiumIO,
    rdma: specs.rdma,
    searchIndex: buildSearchIndex(
      [
        entry.sku,
        entry.size,
        entry.series,
        entry.family,
        entry.familyGroup,
        specs.architecture,
        specs.vcpus === null ? null : `${specs.vcpus} vCPU vCPUs CPU cores`,
        specs.memoryGB === null ? null : `${specs.memoryGB} GB memory RAM`,
        specs.gpuCount ? `${specs.gpuCount} GPU GPUs` : null,
        specs.maxDataDisks === null ? null : `${specs.maxDataDisks} data disks`,
        specs.maxNetworkInterfaces === null ? null : `${specs.maxNetworkInterfaces} NICs`,
        // Only emit a keyword when the capability is present, so a search for "rdma" matches the
        // RDMA-capable sizes instead of every row.
        specs.premiumIO ? 'premium storage premium IO' : null,
        specs.acceleratedNetworking ? 'accelerated networking' : null,
        specs.rdma ? 'RDMA' : null,
        specs.confidentialComputingType
          ? `confidential computing ${specs.confidentialComputingType}`
          : null,
        specs.hasTempDisk ? 'temp disk temporary disk local disk' : null,
      ]
        .filter(Boolean)
        .join(' ')
    ),
    vcpus: specs.vcpus,
  }
}

function buildSkuView(
  baseView: VmSkuBaseView,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode
): VmSkuView {
  const entry = baseView.entry
  const priceProfile: VmDirectoryPriceProfile = entry.priceProfiles[operatingSystem][priceMode]

  return {
    ...baseView,
    pricedRegionIndexes: priceProfile.pricedRegionIndexes,
    minHourlyPrice: priceProfile.minHourlyPrice,
    cheapestRegionIndexes: priceProfile.cheapestRegionIndexes,
  }
}

function buildRegionOptions(
  skus: readonly VmSkuDirectoryEntry[],
  regions: readonly string[],
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode
): readonly FilterOption[] {
  const counts = Array<number>(regions.length).fill(0)
  for (const sku of skus) {
    for (const regionIndex of sku.priceProfiles[operatingSystem][priceMode].pricedRegionIndexes) {
      if (regionIndex >= 0 && regionIndex < counts.length) counts[regionIndex] += 1
    }
  }
  return regions.flatMap((region, index) => {
    const count = counts[index]
    return count ? [{ value: region, label: region, count }] : []
  })
}

function formatCheapestRegionLabel(view: VmSkuView, regions: readonly string[]): string {
  const regionNames = view.cheapestRegionIndexes
    .map((index) => regions[index])
    .filter((region): region is string => Boolean(region))
  return regionNames.length ? regionNames.join(', ') : 'N/A'
}

function buildOptions(values: readonly string[]): readonly FilterOption[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return Array.from(counts, ([value, count]) => ({ value, label: value, count })).sort((a, b) =>
    VM_NAME_COLLATOR.compare(a.label, b.label)
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
    ExportCsvButtonComponent,
    LucideIconComponent,
    VmCatalogNotice,
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
  readonly buildDocumentHref = buildDocumentHref
  private readonly seoService = inject(SeoService)

  readonly vmCatalog = input.required<VmCatalogDocument>()
  readonly pricingSourceFaq = VM_PRICING_SOURCE_FAQ

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
  readonly showAllResults = linkedSignal({
    source: () =>
      [
        this.query(),
        this.selectedType(),
        this.selectedSeries(),
        this.selectedRegion(),
        this.selectedArchitecture(),
        this.selectedFeature(),
        this.selectedVcpus(),
        this.selectedVcpuRange(),
        this.selectedMemoryGB(),
        this.selectedMemoryRange(),
        this.selectedOperatingSystem(),
        this.selectedPriceMode(),
      ] as const,
    computation: () => false,
  })
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
  readonly selectedPriceSourceLabel = computed(() =>
    vmPriceProfileSourceLabel(
      this.catalog().source,
      this.selectedOperatingSystem(),
      this.selectedPriceMode()
    )
  )
  readonly skuBaseViews = computed(() => {
    const catalog = this.catalog()
    return catalog.skus.map(buildSkuBaseView)
  })
  readonly skuViews = computed(() => {
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    return this.skuBaseViews().map((sku) => buildSkuView(sku, operatingSystem, priceMode))
  })
  readonly seriesOptions = computed(() =>
    buildOptions(
      this.skuBaseViews()
        .map((sku) => sku.entry.series)
        .filter(Boolean)
    )
  )
  readonly regionOptions = computed(() => {
    const catalog = this.catalog()
    return buildRegionOptions(
      catalog.skus,
      catalog.regions,
      this.selectedOperatingSystem(),
      this.selectedPriceMode()
    )
  })
  readonly architectureOptions = computed(() =>
    buildOptions(
      this.skuBaseViews()
        .map((sku) => sku.architecture)
        .filter(Boolean)
    )
  )
  readonly vcpusOptions = computed(() =>
    buildNumericOptions(this.skuBaseViews().map((sku) => sku.vcpus))
  )
  readonly memoryOptions = computed(() =>
    buildNumericOptions(this.skuBaseViews().map((sku) => sku.memoryGB))
  )
  readonly comparisonQueryParams = computed(() => ({
    skus: this.selectedComparisonSkuNames().join(',') || null,
    os: this.selectedOperatingSystem(),
    mode: this.selectedPriceMode(),
    region: this.selectedRegion() || null,
  }))
  readonly comparisonReady = computed(() => this.selectedComparisonSkuNames().length >= 2)
  readonly comparisonFull = computed(() => this.selectedComparisonSkuNames().length >= 3)

  readonly filteredSkus = computed(() => {
    const searchQuery = buildSearchQuery(this.query())
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
    const regionIndex = region ? this.catalog().regions.indexOf(region) : null

    const filtered = this.skuViews().filter((sku) => {
      if (!matchesSearchIndex(sku.searchIndex, searchQuery)) return false
      if (type && sku.entry.typeCategory !== type) return false
      if (series && sku.entry.series !== series) return false
      if (regionIndex !== null && !sku.pricedRegionIndexes.includes(regionIndex)) return false
      if (architecture && sku.architecture !== architecture) return false
      if (!matchesVmNumericFilter(sku.vcpus, vcpus, vcpuRange)) return false
      if (!matchesVmNumericFilter(sku.memoryGB, memoryGB, memoryRange)) return false

      switch (feature) {
        case 'accelerated-networking':
          return sku.acceleratedNetworking
        case 'confidential-computing':
          return sku.confidentialComputingType !== null
        case 'confidential-snp':
          return sku.confidentialComputingType === 'SNP'
        case 'confidential-tdx':
          return sku.confidentialComputingType === 'TDX'
        case 'gpu':
          return sku.hasGpu
        case 'no-temp-disk':
          return !sku.hasTempDisk
        case 'premium-io':
          return sku.premiumIO
        case 'rdma':
          return sku.rdma
        case 'temp-disk':
          return sku.hasTempDisk
        default:
          return true
      }
    })

    return [...filtered].sort((left, right) => {
      switch (sortKey) {
        case 'series':
          return (
            compareVmPriceStrings(
              VM_NAME_COLLATOR,
              left.entry.series,
              right.entry.series,
              sortDirection
            ) || VM_NAME_COLLATOR.compare(left.entry.sku, right.entry.sku)
          )
        case 'memory':
          return (
            compareNullableVmPriceNumbers(left.memoryGB, right.memoryGB, sortDirection) ||
            VM_NAME_COLLATOR.compare(left.entry.sku, right.entry.sku)
          )
        case 'regions':
          return (
            compareVmPriceNumbers(
              left.pricedRegionIndexes.length,
              right.pricedRegionIndexes.length,
              sortDirection
            ) || VM_NAME_COLLATOR.compare(left.entry.sku, right.entry.sku)
          )
        case 'price':
          return (
            compareNullableVmPriceNumbers(
              left.minHourlyPrice,
              right.minHourlyPrice,
              sortDirection
            ) || VM_NAME_COLLATOR.compare(left.entry.sku, right.entry.sku)
          )
        case 'vcpus':
          return (
            compareNullableVmPriceNumbers(left.vcpus, right.vcpus, sortDirection) ||
            VM_NAME_COLLATOR.compare(left.entry.sku, right.entry.sku)
          )
        default:
          return compareVmPriceStrings(
            VM_NAME_COLLATOR,
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
  readonly visibleSkus = computed<readonly VisibleVmSkuView[]>(() => {
    const filteredSkus = this.filteredSkus()
    const visibleSkus = this.showAllResults()
      ? filteredSkus
      : filteredSkus.slice(0, INITIAL_VISIBLE_RESULT_COUNT)
    const regions = this.catalog().regions
    return visibleSkus.map((sku) => ({
      ...sku,
      cheapestRegionLabel: formatCheapestRegionLabel(sku, regions),
    }))
  })
  readonly canToggleResultVisibility = computed(
    () => this.filteredSkus().length > INITIAL_VISIBLE_RESULT_COUNT
  )
  readonly resultSummary = computed(() => {
    const visible = this.visibleSkus().length
    const filtered = this.filteredSkus().length
    const total = this.skuBaseViews().length
    const visibleLabel =
      visible < filtered
        ? `${VM_NUMBER_FORMATTER.format(visible)} of ${VM_NUMBER_FORMATTER.format(filtered)}`
        : `all ${VM_NUMBER_FORMATTER.format(filtered)}`
    return `Showing ${visibleLabel} matching VM sizes (${VM_NUMBER_FORMATTER.format(total)} total)`
  })
  readonly resultVisibilityLabel = computed(() =>
    this.showAllResults()
      ? `Show first ${VM_NUMBER_FORMATTER.format(INITIAL_VISIBLE_RESULT_COUNT)} VM sizes`
      : `Show all ${VM_NUMBER_FORMATTER.format(this.filteredSkus().length)} VM sizes`
  )
  readonly csvFilename = 'azure-vm-prices'
  readonly csvHeaders = computed(() => {
    const currency = this.catalog().source.retailPrices.currencyCode
    return [
      'SKU',
      'Series',
      'Type',
      'vCPUs',
      'Memory (GB)',
      'Architecture',
      'Operating system',
      'Pricing model',
      'Price source',
      `Lowest hourly (${currency})`,
      `Estimated monthly (${currency})`,
      'Priced regions',
      'Lowest-price regions',
    ]
  })
  readonly buildCsvRows = (): string[][] => {
    const regions = this.catalog().regions
    return this.filteredSkus().map((view) => [
      view.entry.sku,
      view.entry.series,
      view.entry.typeCategory ?? 'N/A',
      formatVmNumber(view.vcpus),
      formatVmNumber(view.memoryGB),
      view.architecture,
      this.selectedOperatingSystem(),
      this.selectedPriceModeLabel(),
      this.selectedPriceSourceLabel(),
      this.formatHourlyPrice(view.minHourlyPrice),
      this.formatMonthlyPrice(view.minHourlyPrice),
      String(view.pricedRegionIndexes.length),
      formatCheapestRegionLabel(view, regions),
    ])
  }
  ngOnInit(): void {
    const catalog = this.vmCatalog()
    this.seoService.setPageMeta({
      title: 'Azure VM Sizes & Pricing',
      description:
        'Compare Azure VM sizes, specifications, vCPU, memory, and architecture with Linux and Windows pay-as-you-go, savings plan, reserved, and Spot hourly and monthly prices.',
      canonicalUrl: absoluteUrl('/AzureVmPricing'),
      structuredData: [
        buildBreadcrumbList([
          { name: 'Azure resources', path: '/Information/AzureRegions' },
          { name: 'Azure VM Sizes & Pricing', path: '/AzureVmPricing' },
        ]),
        buildDataset({
          name: 'Azure VM Sizes & Pricing',
          description:
            'Azure VM sizes, hardware specifications, direct retail prices, and clearly labeled derived Windows commitment estimates with regional price coverage.',
          url: absoluteUrl('/AzureVmPricing'),
          measurementTechnique:
            'Azure Retail Prices API, derived Windows commitment estimates, and Azure Resource SKUs API',
          variableMeasured: [
            'Hourly retail price',
            'Azure region',
            'VM size',
            'VM series',
            'VM family',
            'capability',
          ],
        }),
        buildItemList({
          name: 'Azure VM prices',
          numberOfItems: catalog.counts.skuCount,
          entries: catalog.skus.slice(0, STRUCTURED_DATA_ITEM_LIMIT).map((sku) => ({
            name: sku.sku,
            path: buildVmSkuHref(sku.sku),
          })),
        }),
        buildFaqPage([VM_PRICING_SOURCE_FAQ]),
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

  toggleResultVisibility(): void {
    this.showAllResults.update((showAll) => !showAll)
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
    return formatVmNumber(value)
  }

  formatHourlyPrice(value: number | null): string {
    return formatVmHourlyPrice(value, this.catalog().source.retailPrices.currencyCode)
  }

  formatMonthlyPrice(value: number | null): string {
    return formatVmMonthlyPrice(value, this.catalog().source.retailPrices.currencyCode)
  }

  readonly buildVmSkuHref = buildVmSkuHref
  readonly comparisonHref = VM_COMPARISON_HREF
}
