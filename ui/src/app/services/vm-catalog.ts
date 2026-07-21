export const VM_CATALOG_DIRECTORY_ASSET_PATH = 'vm-catalog/directory.json'
export const VM_CATALOG_FAMILIES_ASSET_PATH = 'vm-catalog/families.json'
export const VM_CATALOG_REGIONS_ASSET_PATH = 'vm-catalog/regions.json'
export const VM_PRICING_HREF = '/AzureVmPricing'
export const VM_COMPARISON_HREF = `${VM_PRICING_HREF}/Compare`
export const VM_SERIES_DIRECTORY_HREF = `${VM_PRICING_HREF}/Series`
export const VM_REGION_DIRECTORY_HREF = `${VM_PRICING_HREF}/Regions`

export const VM_OPERATING_SYSTEMS = ['Linux', 'Windows'] as const
export type VmOperatingSystem = (typeof VM_OPERATING_SYSTEMS)[number]

export const VM_PRICE_MODES = [
  'PayAsYouGo',
  'Reservation1Year',
  'Reservation3Years',
  'Spot',
] as const
export type VmPriceMode = (typeof VM_PRICE_MODES)[number]

export const VM_PRICE_MODE_OPTIONS = [
  {
    value: 'PayAsYouGo',
    label: 'Pay as you go',
    shortLabel: 'PAYG',
    description: 'Current on-demand retail rate with no term commitment.',
  },
  {
    value: 'Reservation1Year',
    label: '1-year reserved',
    shortLabel: '1-year',
    description: 'One-year reservation total amortized across 8,760 hours.',
  },
  {
    value: 'Reservation3Years',
    label: '3-year reserved',
    shortLabel: '3-year',
    description: 'Three-year reservation total amortized across 26,280 hours.',
  },
  {
    value: 'Spot',
    label: 'Spot',
    shortLabel: 'Spot',
    description: 'Interruptible capacity that Azure can evict and whose price can change.',
  },
] as const satisfies readonly {
  readonly value: VmPriceMode
  readonly label: string
  readonly shortLabel: string
  readonly description: string
}[]

export type VmPriceProfileMap<T> = Readonly<
  Record<VmOperatingSystem, Readonly<Record<VmPriceMode, T>>>
>

export interface VmSkuPriceProfile {
  readonly pricedLocations: readonly string[]
  readonly minHourlyPrice: number | null
  readonly cheapestLocations: readonly string[]
}

export interface VmSkuPriceSummary {
  readonly pricedRegionCount: number
  readonly minHourlyPrice: number | null
}

export interface VmDirectoryPriceProfile {
  readonly pricedRegionIndexes: readonly number[]
  readonly cheapestRegionIndexes: readonly number[]
  readonly minHourlyPrice: number | null
}

export interface VmRegionalPriceProfile {
  readonly hourlyPrice: number
  readonly matchStatus: VmPriceMatchStatus
}

export interface VmCatalogSource {
  readonly regionAllowlist: {
    readonly file: 'src/assets/data/regions.json'
    readonly regionCount: number
  }
  readonly resourceSkus: {
    readonly apiVersion: string
    readonly subscriptionScoped: true
  }
  readonly retailPrices: {
    readonly apiVersion: string
    readonly currencyCode: string
    readonly operatingSystems: readonly VmOperatingSystem[]
    readonly priceModes: readonly VmPriceMode[]
    readonly reservationTerms: readonly ['1 Year', '3 Years']
    readonly unitOfMeasure: '1 Hour'
  }
}

export interface VmCatalogCounts {
  readonly skuCount: number
  readonly pricedSkuCount: number
  readonly windowsPricedSkuCount: number
  readonly familyCount: number
  readonly regionCount: number
  readonly pricedRegionCount: number
  readonly windowsPricedRegionCount: number
  readonly regionalPriceCount: number
  readonly windowsRegionalPriceCount: number
  readonly priceProfiles: VmPriceProfileMap<{
    readonly pricedSkuCount: number
    readonly pricedRegionCount: number
    readonly regionalPriceCount: number
  }>
  readonly observedSkuRegionCount: number
}

export interface VmCatalogContext {
  readonly source: VmCatalogSource
  readonly counts: VmCatalogCounts
}

export type VmPriceMatchStatus = 'exact' | 'sku-only'

export interface VmSkuCatalogEntry {
  readonly sku: string
  readonly skuKey: string
  readonly family: string
  readonly familyGroup: string | null
  readonly series: string
  readonly size: string
  readonly observedLocations: readonly string[]
  readonly pricedLocations: readonly string[]
  readonly minHourlyPrice: number | null
  readonly cheapestLocations: readonly string[]
  readonly windowsPricedLocations: readonly string[]
  readonly windowsMinHourlyPrice: number | null
  readonly windowsCheapestLocations: readonly string[]
  readonly priceProfiles: VmPriceProfileMap<VmSkuPriceProfile>
  readonly coreCapabilities: Readonly<Record<string, string | undefined>>
}

export const VM_DIRECTORY_CAPABILITY_NAMES = [
  'vCPUs',
  'MemoryGB',
  'MaxDataDiskCount',
  'MaxNetworkInterfaces',
  'CpuArchitectureType',
  'GPUs',
  'PremiumIO',
  'AcceleratedNetworkingEnabled',
  'RdmaEnabled',
] as const

export interface VmSkuDirectoryEntry {
  readonly sku: string
  readonly skuKey: string
  readonly family: string
  readonly familyGroup: string | null
  readonly series: string
  readonly size: string
  readonly observedRegionIndexes: readonly number[]
  readonly pricedRegionIndexes: readonly number[]
  readonly cheapestRegionIndexes: readonly number[]
  readonly minHourlyPrice: number | null
  readonly windowsPricedRegionIndexes: readonly number[]
  readonly windowsCheapestRegionIndexes: readonly number[]
  readonly windowsMinHourlyPrice: number | null
  readonly priceProfiles: VmPriceProfileMap<VmDirectoryPriceProfile>
  readonly specs: readonly (string | null)[]
}

export interface VmSkuSummary {
  readonly sku: string
  readonly skuKey: string
  readonly family: string
  readonly familyGroup: string | null
  readonly series: string
  readonly size: string
  readonly observedRegionCount: number
  readonly pricedRegionCount: number
  readonly minHourlyPrice: number | null
  readonly windowsPricedRegionCount: number
  readonly windowsMinHourlyPrice: number | null
  readonly priceProfiles: VmPriceProfileMap<VmSkuPriceSummary>
  readonly coreCapabilities: Readonly<Record<string, string | undefined>>
}

export interface VmRegionSkuSummary {
  readonly sku: string
  readonly skuKey: string
  readonly family: string
  readonly familyGroup: string | null
  readonly series: string
  readonly size: string
  readonly observedRegionCount: number
  readonly pricedRegionCount: number
  readonly minHourlyPrice: number | null
  readonly windowsPricedRegionCount: number
  readonly windowsMinHourlyPrice: number | null
  readonly priceProfiles: VmPriceProfileMap<VmSkuPriceSummary>
  readonly specs: readonly (string | null)[]
}

export interface VmRegionPriceSummary extends VmRegionSkuSummary {
  readonly hourlyPrice: number | null
  readonly matchStatus: VmPriceMatchStatus | null
  readonly windowsHourlyPrice: number | null
  readonly windowsMatchStatus: VmPriceMatchStatus | null
  readonly regionalPriceProfiles: VmPriceProfileMap<VmRegionalPriceProfile | null>
}

export interface VmFamilySummary {
  readonly family: string
  readonly familyGroup: string | null
  readonly series: string
  readonly routeSlug: string
  readonly skuCount: number
  readonly singletonSku: string | null
}

export type VmRegionStatus = 'available' | 'planned' | 'preview' | 'restricted' | 'unmapped'

export interface VmRegionRegistryEntry {
  readonly armRegionName: string
  readonly canonicalRegionId: string
  readonly routeSlug: string
  readonly displayName: string
  readonly status: VmRegionStatus
  readonly geography: string
  readonly regionGroup: string
  readonly metadataSource:
    | 'azure-region-catalog'
    | 'azure-upcoming-region-catalog'
    | 'resource-skus-only'
    | 'retail-prices-only'
    | 'service-tags'
  readonly publiclyDocumented: boolean
  readonly indexable: boolean
  readonly pricedSkuCount: number
  readonly windowsPricedSkuCount: number
  readonly priceProfiles: VmPriceProfileMap<number>
  readonly observedSkuCount: number
  readonly regionDetailPath: string | null
}

export interface VmSkuRegionPriceAsset {
  readonly armRegionName: string
  readonly location: string
  readonly hourlyPrice: number | null
  readonly matchStatus: VmPriceMatchStatus | null
  readonly windowsHourlyPrice: number | null
  readonly windowsMatchStatus: VmPriceMatchStatus | null
  readonly regionalPriceProfiles: VmPriceProfileMap<VmRegionalPriceProfile | null>
}

export interface VmSkuRegionPrice extends VmSkuRegionPriceAsset {
  readonly region: VmRegionRegistryEntry
}

export interface VmCatalogDocument extends VmCatalogContext {
  readonly regions: readonly string[]
  readonly skus: readonly VmSkuDirectoryEntry[]
}

export interface VmRegionsDocument extends VmCatalogContext {
  readonly indexableRegionCount: number
  readonly regions: readonly VmRegionRegistryEntry[]
}

export interface VmFamiliesDocument extends VmCatalogContext {
  readonly familyPageCount: number
  readonly families: readonly VmFamilySummary[]
}

export interface VmFamilyDetailDocument extends Omit<VmCatalogContext, 'counts'> {
  readonly counts: {
    readonly skuCount: number
  }
  readonly family: VmFamilySummary
  readonly skus: readonly VmRegionSkuSummary[]
}

export interface VmSkuDetailDocument extends VmCatalogContext {
  readonly sku: VmSkuCatalogEntry
  readonly familySummary: VmFamilySummary
  readonly regions: readonly VmRegionRegistryEntry[]
  readonly prices: readonly VmSkuRegionPrice[]
}

export interface VmSkuDetailAssetDocument extends VmCatalogContext {
  readonly sku: VmSkuCatalogEntry
  readonly familySummary: VmFamilySummary
  readonly prices: readonly VmSkuRegionPriceAsset[]
}

export interface VmRegionDetailDocument extends Omit<VmCatalogContext, 'counts'> {
  readonly counts: {
    readonly pricedSkuCount: number
    readonly windowsPricedSkuCount: number
    readonly observedSkuCount: number
    readonly familyCount: number
    readonly windowsFamilyCount: number
    readonly priceProfiles: VmPriceProfileMap<{
      readonly pricedSkuCount: number
      readonly familyCount: number
    }>
  }
  readonly region: VmRegionRegistryEntry
  readonly prices: readonly VmRegionPriceSummary[]
}

export interface VmComparisonDocument {
  readonly catalog: VmCatalogDocument
  readonly regionDirectory: VmRegionsDocument
  readonly skus: readonly VmSkuDetailDocument[]
  readonly invalidSkuNames: readonly string[]
  readonly omittedSkuNames: readonly string[]
  readonly selectedOperatingSystem: VmOperatingSystem
  readonly selectedPriceMode: VmPriceMode
  readonly requestedRegion: string
}

export function vmSkuAssetPath(skuName: string): string {
  return `vm-catalog/skus/${encodeURIComponent(skuName.trim().toLowerCase())}.json`
}

export function vmSeriesAssetPath(seriesSlug: string): string {
  return `vm-catalog/families/${encodeURIComponent(seriesSlug.trim().toLowerCase())}.json`
}

export function vmRegionAssetPath(armRegionName: string): string {
  return `vm-catalog/regions/${encodeURIComponent(armRegionName.trim().toLowerCase())}.json`
}

export function buildVmSkuHref(skuName: string, armRegionName?: string): string {
  const path = `${VM_PRICING_HREF}/${encodeURIComponent(skuName.trim())}`
  return armRegionName
    ? `${path}#region-${encodeURIComponent(armRegionName.trim().toLowerCase())}`
    : path
}

export function buildVmSeriesSlug(series: string): string {
  return series
    .trim()
    .replace(/\s+Series$/i, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildVmSeriesHref(series: string): string {
  return `${VM_SERIES_DIRECTORY_HREF}/${encodeURIComponent(buildVmSeriesSlug(series))}`
}

export function buildVmRegionHref(armRegionName: string): string {
  return `${VM_REGION_DIRECTORY_HREF}/${encodeURIComponent(armRegionName.trim().toLowerCase())}`
}

export function vmPriceModeLabel(priceMode: VmPriceMode): string {
  return VM_PRICE_MODE_OPTIONS.find((option) => option.value === priceMode)?.label ?? priceMode
}

export function vmPriceModeShortLabel(priceMode: VmPriceMode): string {
  return VM_PRICE_MODE_OPTIONS.find((option) => option.value === priceMode)?.shortLabel ?? priceMode
}

export function vmPriceModeDescription(priceMode: VmPriceMode): string {
  return VM_PRICE_MODE_OPTIONS.find((option) => option.value === priceMode)?.description ?? ''
}

function createVmPriceProfileMap<T>(
  factory: (operatingSystem: VmOperatingSystem, priceMode: VmPriceMode) => T
): VmPriceProfileMap<T> {
  return Object.fromEntries(
    VM_OPERATING_SYSTEMS.map((operatingSystem) => [
      operatingSystem,
      Object.fromEntries(
        VM_PRICE_MODES.map((priceMode) => [priceMode, factory(operatingSystem, priceMode)])
      ),
    ])
  ) as VmPriceProfileMap<T>
}

export function expandVmDirectorySku(
  sku: VmSkuDirectoryEntry,
  regions: readonly string[]
): VmSkuCatalogEntry {
  return {
    sku: sku.sku,
    skuKey: sku.skuKey,
    family: sku.family,
    series: sku.series,
    familyGroup: sku.familyGroup,
    size: sku.size,
    observedLocations: sku.observedRegionIndexes.map((index) => regions[index]),
    pricedLocations: sku.pricedRegionIndexes.map((index) => regions[index]),
    minHourlyPrice: sku.minHourlyPrice,
    cheapestLocations: sku.cheapestRegionIndexes.map((index) => regions[index]),
    windowsPricedLocations: sku.windowsPricedRegionIndexes.map((index) => regions[index]),
    windowsMinHourlyPrice: sku.windowsMinHourlyPrice,
    windowsCheapestLocations: sku.windowsCheapestRegionIndexes.map((index) => regions[index]),
    priceProfiles: createVmPriceProfileMap((operatingSystem, priceMode) => {
      const priceProfile = sku.priceProfiles[operatingSystem][priceMode]
      return {
        pricedLocations: priceProfile.pricedRegionIndexes.map((index) => regions[index]),
        minHourlyPrice: priceProfile.minHourlyPrice,
        cheapestLocations: priceProfile.cheapestRegionIndexes.map((index) => regions[index]),
      }
    }),
    coreCapabilities: expandVmCompactSpecs(sku.specs),
  }
}

export function expandVmRegionSku(sku: VmRegionSkuSummary): VmSkuSummary {
  return {
    sku: sku.sku,
    skuKey: sku.skuKey,
    family: sku.family,
    series: sku.series,
    familyGroup: sku.familyGroup,
    size: sku.size,
    observedRegionCount: sku.observedRegionCount,
    pricedRegionCount: sku.pricedRegionCount,
    minHourlyPrice: sku.minHourlyPrice,
    windowsPricedRegionCount: sku.windowsPricedRegionCount,
    windowsMinHourlyPrice: sku.windowsMinHourlyPrice,
    priceProfiles: sku.priceProfiles,
    coreCapabilities: expandVmCompactSpecs(sku.specs),
  }
}

export function vmCatalogPriceCounts(
  counts: VmCatalogCounts,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode = 'PayAsYouGo'
): {
  readonly pricedSkuCount: number
  readonly pricedRegionCount: number
  readonly regionalPriceCount: number
} {
  return counts.priceProfiles[operatingSystem][priceMode]
}

export function vmSkuMinHourlyPrice(
  sku: {
    readonly priceProfiles: VmPriceProfileMap<{ readonly minHourlyPrice: number | null }>
  },
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode = 'PayAsYouGo'
): number | null {
  return sku.priceProfiles[operatingSystem][priceMode].minHourlyPrice
}

export function vmSkuPricedRegionCount(
  sku: {
    readonly priceProfiles: VmPriceProfileMap<{ readonly pricedRegionCount: number }>
  },
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode = 'PayAsYouGo'
): number {
  return sku.priceProfiles[operatingSystem][priceMode].pricedRegionCount
}

export function vmSkuPricedLocations(
  sku: VmSkuCatalogEntry,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode = 'PayAsYouGo'
): readonly string[] {
  return sku.priceProfiles[operatingSystem][priceMode].pricedLocations
}

export function vmSkuCheapestLocations(
  sku: VmSkuCatalogEntry,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode = 'PayAsYouGo'
): readonly string[] {
  return sku.priceProfiles[operatingSystem][priceMode].cheapestLocations
}

export function vmRegionHourlyPrice(
  price: Pick<VmSkuRegionPriceAsset, 'regionalPriceProfiles'>,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode = 'PayAsYouGo'
): number | null {
  return price.regionalPriceProfiles[operatingSystem][priceMode]?.hourlyPrice ?? null
}

export function vmRegionMatchStatus(
  price: Pick<VmSkuRegionPriceAsset, 'regionalPriceProfiles'>,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode = 'PayAsYouGo'
): VmPriceMatchStatus | null {
  return price.regionalPriceProfiles[operatingSystem][priceMode]?.matchStatus ?? null
}

export function vmRegionPricedSkuCount(
  region: Pick<VmRegionRegistryEntry, 'priceProfiles'>,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode = 'PayAsYouGo'
): number {
  return region.priceProfiles[operatingSystem][priceMode]
}

function expandVmCompactSpecs(
  specs: readonly (string | null)[]
): Readonly<Record<string, string | undefined>> {
  const coreCapabilities: Record<string, string | undefined> = {}
  VM_DIRECTORY_CAPABILITY_NAMES.forEach((name, index) => {
    const value = specs[index]
    if (value !== null) coreCapabilities[name] = value
  })
  return coreCapabilities
}

export const VM_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'General purpose', label: 'General purpose' },
  { value: 'Compute optimized', label: 'Compute optimized' },
  { value: 'Memory optimized', label: 'Memory optimized' },
  { value: 'Storage optimized', label: 'Storage optimized' },
  { value: 'GPU accelerated', label: 'GPU accelerated' },
  { value: 'FPGA accelerated', label: 'FPGA accelerated' },
  { value: 'High performance compute', label: 'High performance compute' },
] as const

export type VmTypeCategory = (typeof VM_TYPE_OPTIONS)[number]['value']

const FAMILY_GROUP_TO_TYPE: Readonly<Record<string, string>> = {
  'A-family': 'General purpose',
  'B-family': 'General purpose',
  'D-family': 'General purpose',
  'DC-family': 'General purpose',
  'F-family': 'Compute optimized',
  'FX-family': 'Compute optimized',
  'E-family': 'Memory optimized',
  'Eb-family': 'Memory optimized',
  'EC-family': 'Memory optimized',
  'G-family': 'Memory optimized',
  'M-family': 'Memory optimized',
  'X-family': 'Memory optimized',
  'L-family': 'Storage optimized',
  'NC-family': 'GPU accelerated',
  'ND-family': 'GPU accelerated',
  'NG-family': 'GPU accelerated',
  'NV-family': 'GPU accelerated',
  'NP-family': 'FPGA accelerated',
  'P-family': 'FPGA accelerated',
  'H-family': 'High performance compute',
  'HB-family': 'High performance compute',
  'HC-family': 'High performance compute',
  'HX-family': 'High performance compute',
}

export function vmTypeCategory(familyGroup: string | null): string {
  if (!familyGroup) return ''
  return FAMILY_GROUP_TO_TYPE[familyGroup] ?? ''
}
