export const VM_CATALOG_DIRECTORY_ASSET_PATH = 'vm-catalog/directory.json'
export const VM_CATALOG_FAMILIES_ASSET_PATH = 'vm-catalog/families.json'
export const VM_CATALOG_MANIFEST_ASSET_PATH = 'vm-catalog/manifest.json'
export const VM_CATALOG_REGIONS_ASSET_PATH = 'vm-catalog/regions.json'
const VM_PRICING_HREF = '/AzureVmPricing'
export const VM_COMPARISON_HREF = `${VM_PRICING_HREF}/Compare`
const VM_SERIES_DIRECTORY_HREF = `${VM_PRICING_HREF}/Series`
const VM_REGION_DIRECTORY_HREF = `${VM_PRICING_HREF}/Regions`
export const VM_MONTHLY_HOURS = 730

export const VM_OPERATING_SYSTEMS = ['Linux', 'Windows'] as const
export type VmOperatingSystem = (typeof VM_OPERATING_SYSTEMS)[number]

export const VM_PRICE_MODES = [
  'PayAsYouGo',
  'SavingsPlan1Year',
  'SavingsPlan3Years',
  'Reservation1Year',
  'Reservation3Years',
  'Spot',
] as const
export type VmPriceMode = (typeof VM_PRICE_MODES)[number]

interface VmDerivedPriceProfile {
  readonly operatingSystem: VmOperatingSystem
  readonly priceMode: VmPriceMode
  readonly basis:
    | 'linux-reservation-plus-windows-payg-surcharge'
    | 'linux-savings-plan-plus-windows-payg-surcharge'
  readonly description: string
}

export const VM_PRICE_MODE_OPTIONS = [
  {
    value: 'PayAsYouGo',
    label: 'Pay as you go',
    shortLabel: 'PAYG',
    description: 'Current on-demand retail rate with no term commitment.',
  },
  {
    value: 'SavingsPlan1Year',
    label: '1-year savings plan',
    shortLabel: 'SP 1-year',
    description:
      'Discounted hourly rate for eligible compute usage covered by a one-year Azure savings plan commitment.',
  },
  {
    value: 'SavingsPlan3Years',
    label: '3-year savings plan',
    shortLabel: 'SP 3-year',
    description:
      'Discounted hourly rate for eligible compute usage covered by a three-year Azure savings plan commitment.',
  },
  {
    value: 'Reservation1Year',
    label: '1-year reserved',
    shortLabel: 'RI 1-year',
    description: 'One-year reservation total amortized across 12 months of 730 hours.',
  },
  {
    value: 'Reservation3Years',
    label: '3-year reserved',
    shortLabel: 'RI 3-year',
    description: 'Three-year reservation total amortized across 36 months of 730 hours.',
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

type VmPriceProfileMap<T> = Readonly<Record<VmOperatingSystem, Readonly<Record<VmPriceMode, T>>>>

interface VmSkuPriceProfile {
  readonly pricedLocations: readonly string[]
  readonly minHourlyPrice: number | null
  readonly cheapestLocations: readonly string[]
}

interface VmSkuPriceSummary {
  readonly pricedRegionCount: number
  readonly minHourlyPrice: number | null
}

export interface VmDirectoryPriceProfile {
  readonly pricedRegionIndexes: readonly number[]
  readonly cheapestRegionIndexes: readonly number[]
  readonly minHourlyPrice: number | null
}

interface VmCatalogSource {
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
    readonly savingsPlanTerms: readonly ['1 Year', '3 Years']
    readonly unitOfMeasure: '1 Hour'
    readonly derivedPriceProfiles: readonly VmDerivedPriceProfile[]
  }
}

interface VmCatalogCounts {
  readonly skuCount: number
  readonly familyCount: number
  readonly regionCount: number
  readonly priceProfiles: VmPriceProfileMap<{
    readonly pricedSkuCount: number
    readonly pricedRegionCount: number
    readonly regionalPriceCount: number
  }>
}

export interface VmCatalogContext {
  readonly source: VmCatalogSource
  readonly counts: VmCatalogCounts
}

export type VmCatalogMetadata = Pick<VmCatalogContext, 'source'>

export interface VmSkuCatalogEntry {
  readonly sku: string
  readonly skuKey: string
  readonly family: string
  readonly familyGroup: string | null
  readonly typeCategory: VmTypeCategory | null
  readonly series: string
  readonly size: string
  readonly observedLocations: readonly string[]
  readonly priceProfiles: VmPriceProfileMap<VmSkuPriceProfile>
  readonly coreCapabilities: Readonly<Record<string, string | undefined>>
}

export interface VmSkuSpecs {
  readonly acceleratedNetworking: boolean
  readonly architecture: string | null
  /** `SNP` for AMD SEV-SNP, `TDX` for Intel TDX, `null` without a hardware TEE. */
  readonly confidentialComputingType: string | null
  readonly gpuCount: number | null
  readonly hasTempDisk: boolean
  readonly maxDataDisks: number | null
  readonly maxNetworkInterfaces: number | null
  readonly memoryGB: number | null
  readonly premiumIO: boolean
  readonly rdma: boolean
  readonly vcpus: number | null
}

export interface VmSkuDirectoryEntry {
  readonly sku: string
  readonly skuKey: string
  readonly family: string
  readonly familyGroup: string | null
  readonly typeCategory: VmTypeCategory | null
  readonly series: string
  readonly size: string
  readonly priceProfiles: VmPriceProfileMap<VmDirectoryPriceProfile>
  readonly specs: VmSkuSpecs
}

export interface VmSkuSummary {
  readonly sku: string
  readonly skuKey: string
  readonly family: string
  readonly familyGroup: string | null
  readonly typeCategory: VmTypeCategory | null
  readonly series: string
  readonly size: string
  readonly priceProfiles: VmPriceProfileMap<VmSkuPriceSummary>
  readonly specs: VmSkuSpecs
}

type VmSparsePriceProfileMap<T> = Readonly<
  Record<VmOperatingSystem, Partial<Readonly<Record<VmPriceMode, T>>>>
>

export type VmRegionSkuSpecs = Pick<VmSkuSpecs, 'architecture' | 'gpuCount' | 'memoryGB' | 'vcpus'>

type VmRegionPriceCountTuple = readonly [
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
]

export interface VmRegionPriceSummary {
  readonly sku: string
  readonly skuKey: string
  readonly familyGroup: string | null
  readonly typeCategory: VmTypeCategory | null
  readonly series: string
  readonly size: string
  readonly specs: VmRegionSkuSpecs
  readonly hourlyPrices: VmSparsePriceProfileMap<number>
  readonly pricedRegionCounts: Readonly<Record<VmOperatingSystem, VmRegionPriceCountTuple>>
}

export interface VmFamilySummary {
  readonly family: string
  readonly familyGroup: string | null
  readonly typeCategory: VmTypeCategory | null
  readonly series: string
  readonly routeSlug: string
  readonly skuCount: number
  readonly singletonSku: string | null
}

export type VmRegionStatus = 'available' | 'planned' | 'preview' | 'restricted' | 'unmapped'

interface VmRegionRegistryEntry {
  readonly armRegionName: string
  readonly displayName: string
  readonly status: VmRegionStatus
  readonly geography: string
  readonly regionGroup: string
  readonly indexable: boolean
  readonly priceProfiles: VmPriceProfileMap<number>
  readonly regionDetailPath: string | null
}

interface VmSkuRegionPriceAsset {
  readonly armRegionName: string
  readonly regionalPriceProfiles: VmPriceProfileMap<number | null>
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

export interface VmFamilyDetailDocument extends VmCatalogMetadata {
  readonly counts: {
    readonly skuCount: number
  }
  readonly family: VmFamilySummary
  readonly skus: readonly VmSkuSummary[]
}

export interface VmSkuDetailDocument extends VmCatalogMetadata {
  readonly sku: VmSkuCatalogEntry
  readonly familySummary: VmFamilySummary
  readonly regions: readonly VmRegionRegistryEntry[]
  readonly prices: readonly VmSkuRegionPrice[]
}

export interface VmSkuDetailAssetDocument extends VmCatalogMetadata {
  readonly sku: VmSkuCatalogEntry
  readonly familySummary: VmFamilySummary
  readonly prices: readonly VmSkuRegionPriceAsset[]
}

export interface VmRegionDetailDocument extends VmCatalogMetadata {
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
  readonly showDifferencesOnly: boolean
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

function buildVmSeriesSlug(series: string): string {
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

function findVmDerivedPriceProfile(
  source: VmCatalogSource,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode
): VmDerivedPriceProfile | undefined {
  return source.retailPrices.derivedPriceProfiles.find(
    (profile) => profile.operatingSystem === operatingSystem && profile.priceMode === priceMode
  )
}

export function vmPriceProfileSourceLabel(
  source: VmCatalogSource,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode
): string {
  const derivedProfile = findVmDerivedPriceProfile(source, operatingSystem, priceMode)
  if (!derivedProfile) return 'Azure Retail Prices API'
  return derivedProfile.basis === 'linux-savings-plan-plus-windows-payg-surcharge'
    ? 'Estimated from Linux savings plan price plus the Windows pay-as-you-go software surcharge'
    : 'Estimated from Linux reserved price plus the Windows pay-as-you-go software surcharge'
}

export function vmRegionPricedRegionCount(
  price: VmRegionPriceSummary,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode
): number | null {
  return price.pricedRegionCounts[operatingSystem][VM_PRICE_MODES.indexOf(priceMode)] ?? null
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

export function vmRegionHourlyPrice(
  price: Pick<VmSkuRegionPriceAsset, 'regionalPriceProfiles'>,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode = 'PayAsYouGo'
): number | null {
  return price.regionalPriceProfiles[operatingSystem][priceMode]
}

export function vmRegionPricedSkuCount(
  region: Pick<VmRegionRegistryEntry, 'priceProfiles'>,
  operatingSystem: VmOperatingSystem,
  priceMode: VmPriceMode = 'PayAsYouGo'
): number {
  return region.priceProfiles[operatingSystem][priceMode]
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

type VmTypeCategory = Exclude<(typeof VM_TYPE_OPTIONS)[number]['value'], ''>
