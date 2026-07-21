export const SERVICE_TAG_ASSET_BASE_PATH = 'service-tags'
export const SERVICE_TAG_SUMMARY_SHARD_COUNT = 64
export const SERVICE_TAG_REGION_DIRECTORY_PATH = 'service-tags/regions.json'
export const SERVICE_TAG_SERVICE_DIRECTORY_PATH = 'service-tags/services.json'

export const SERVICE_TAG_CLOUDS = ['public', 'china', 'usgovernment'] as const

export type ServiceTagCloud = (typeof SERVICE_TAG_CLOUDS)[number]
export type ServiceTagScope = 'global' | 'regional'
export type ServiceTagRegionStatus = 'available' | 'restricted' | 'planned' | 'preview' | 'unmapped'

export interface ServiceTagCloudDirectoryEntry {
  id: ServiceTagCloud
  label: string
  downloadUrl: string
  serviceCount: number
  regionCount: number
}

export interface ServiceTagDirectoryRegionWire {
  regionId: string
  regionDisplayName: string
  regionGroup: string
}

export interface ServiceTagDirectoryItemWire {
  serviceTagId: string
  regionIndex?: number
  prefixCount: number
}

export interface ServiceTagServiceDirectoryEntryWire {
  service: string
  serviceTags: ServiceTagDirectoryItemWire[]
}

export interface ServiceTagDirectoryItem {
  serviceTagId: string
  requiresCloudRoute: boolean
  scope: ServiceTagScope
  regionId: string
  regionDisplayName: string
  regionGroup: string
  prefixCount: number
}

export interface ServiceTagServiceDirectoryEntry {
  cloud: ServiceTagCloud
  service: string
  serviceTags: ServiceTagDirectoryItem[]
}

export interface ServiceTagRegionDirectoryEntry {
  cloud: ServiceTagCloud
  regionId: string
  canonicalRegionId: string
  displayName: string
  regionGroup: string
  geography: string
  serviceTagId: string
  requiresCloudRoute: boolean
  status: ServiceTagRegionStatus
}

export interface ServiceTagDirectoryMetadata {
  clouds: ServiceTagCloudDirectoryEntry[]
}

export interface ServiceTagServiceDirectoriesWire extends ServiceTagDirectoryMetadata {
  cloudRouteServiceTagIds: string[]
  regionTable: Record<ServiceTagCloud, ServiceTagDirectoryRegionWire[]>
  serviceDirectory: Record<ServiceTagCloud, ServiceTagServiceDirectoryEntryWire[]>
}

export interface ServiceTagRegionDirectories extends ServiceTagDirectoryMetadata {
  regionDirectory: ServiceTagRegionDirectoryEntry[]
}

export interface ServiceTagServiceDirectories extends ServiceTagDirectoryMetadata {
  serviceDirectory: ServiceTagServiceDirectoryEntry[]
}

export interface ServiceTagPageData {
  cloud: ServiceTagCloud
  serviceTagId: string
  scope: ServiceTagScope
  regionId: string | null
  ipAddressPrefixes: string[]
  loadedPrefixCount: number
  totalPrefixCount: number
  ipv4PrefixCount: number
  ipv6PrefixCount: number
  prefixesComplete: boolean
  legacyRoute?: boolean
}

export interface ServiceTagSummaryWire {
  regionId?: string
  ipAddressPrefixes: string[]
  totalPrefixCount: number
  ipv4PrefixCount: number
}

export interface ServiceTagPageLoadError {
  error: string
  cloud?: ServiceTagCloud
  legacyRoute?: boolean
}

export type ServiceTagPageRouteData = ServiceTagPageData | ServiceTagPageLoadError | null

export function decodeServiceTagServiceDirectories(
  wire: ServiceTagServiceDirectoriesWire
): ServiceTagServiceDirectories {
  const cloudRouteServiceTagIds = new Set(wire.cloudRouteServiceTagIds)
  const serviceDirectory = SERVICE_TAG_CLOUDS.flatMap((cloud) => {
    const regions = wire.regionTable[cloud]

    return wire.serviceDirectory[cloud].map((service) => ({
      cloud,
      service: service.service,
      serviceTags: service.serviceTags.map((serviceTag): ServiceTagDirectoryItem => {
        const base = {
          serviceTagId: serviceTag.serviceTagId,
          requiresCloudRoute: cloudRouteServiceTagIds.has(serviceTag.serviceTagId),
          prefixCount: serviceTag.prefixCount,
        }

        if (serviceTag.regionIndex === undefined) {
          return {
            ...base,
            scope: 'global',
            regionId: '',
            regionDisplayName: '',
            regionGroup: 'Other service-tag scopes',
          }
        }

        const region = regions[serviceTag.regionIndex]
        return {
          ...base,
          scope: 'regional',
          regionId: region.regionId,
          regionDisplayName: region.regionDisplayName,
          regionGroup: region.regionGroup,
        }
      }),
    }))
  })

  return { clouds: wire.clouds, serviceDirectory }
}

export function decodeServiceTagSummary(
  wire: ServiceTagSummaryWire,
  cloud: ServiceTagCloud,
  serviceTagId: string
): ServiceTagPageData {
  return {
    cloud,
    serviceTagId,
    scope: wire.regionId === undefined ? 'global' : 'regional',
    regionId: wire.regionId ?? null,
    ipAddressPrefixes: wire.ipAddressPrefixes,
    loadedPrefixCount: wire.ipAddressPrefixes.length,
    totalPrefixCount: wire.totalPrefixCount,
    ipv4PrefixCount: wire.ipv4PrefixCount,
    ipv6PrefixCount: wire.totalPrefixCount - wire.ipv4PrefixCount,
    prefixesComplete: wire.ipAddressPrefixes.length === wire.totalPrefixCount,
  }
}

const AZURE_CLOUD_SERVICE_TAG_REGION_ALIASES: Readonly<Record<string, string>> = {
  brazilsoutheast: 'brazilse',
  chilecentral: 'chilec',
  francecentral: 'centralfrance',
  francesouth: 'southfrance',
  germanynorth: 'germanyn',
  germanywestcentral: 'germanywc',
  norwayeast: 'norwaye',
  norwaywest: 'norwayw',
  switzerlandnorth: 'switzerlandn',
  switzerlandwest: 'switzerlandw',
}

export function normalizeServiceTagIdInput(value: string | undefined): string {
  const normalized = value?.trim()
  if (normalized === '') return 'AzureCloud'
  return normalized ?? 'AzureCloud'
}

export function normalizeServiceTagCloud(value: string | undefined): ServiceTagCloud {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'china') return 'china'
  if (normalized === 'usgovernment' || normalized === 'usgov' || normalized === 'government') {
    return 'usgovernment'
  }
  return 'public'
}

export function inferLegacyServiceTagCloud(serviceTagId: string): ServiceTagCloud {
  if (/\.(?:ChinaEast(?:2|3)?|ChinaNorth(?:2|3)?)$/i.test(serviceTagId)) return 'china'
  if (
    /\.(?:USDoDCentral|USDoDEast|USGovArizona|USGovIowa|USGovTexas|USGovVirginia)$/i.test(
      serviceTagId
    )
  ) {
    return 'usgovernment'
  }
  if (serviceTagId.toLowerCase() === 'azureportal.azureappserviceux') return 'usgovernment'
  return 'public'
}

export function serviceTagSummaryShardPath(cloud: ServiceTagCloud, serviceTagId: string): string {
  const shardId = serviceTagSummaryShardId(serviceTagId)
  return `${SERVICE_TAG_ASSET_BASE_PATH}/summary-shards/${cloud}/${shardId}.json`
}

export function serviceTagRemainingPrefixesPath(
  cloud: ServiceTagCloud,
  serviceTagId: string
): string {
  return `${SERVICE_TAG_ASSET_BASE_PATH}/remaining-prefixes/${cloud}/${encodeURIComponent(serviceTagId)}.json`
}

export function serviceTagSummaryShardId(serviceTagId: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < serviceTagId.length; index += 1) {
    hash ^= serviceTagId.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return ((hash >>> 0) % SERVICE_TAG_SUMMARY_SHARD_COUNT).toString(16).padStart(2, '0')
}

export function buildServiceTagHref(
  cloud: ServiceTagCloud,
  serviceTagId: string,
  requiresCloudRoute = cloud !== 'public',
  source?: 'region' | 'service'
): string {
  const encodedServiceTagId = encodeURIComponent(serviceTagId)
  const path =
    cloud === 'public' || !requiresCloudRoute
      ? `/Information/AzureIpRanges/${encodedServiceTagId}`
      : `/Information/AzureIpRanges/${cloud}/${encodedServiceTagId}`
  return source ? `${path}?source=${source}` : path
}

export function buildAzureCloudRegionServiceTagHref(regionId: string): string {
  const normalizedRegionId = regionId.trim().toLowerCase()
  const serviceTagRegionId =
    AZURE_CLOUD_SERVICE_TAG_REGION_ALIASES[normalizedRegionId] ?? normalizedRegionId
  return buildServiceTagHref('public', `AzureCloud.${serviceTagRegionId}`, false)
}

export function isServiceTagPageData(value: ServiceTagPageRouteData): value is ServiceTagPageData {
  return Boolean(value && 'serviceTagId' in value)
}
