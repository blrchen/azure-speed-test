/**
 * Service-tag URL building, kept separate from service-tags-snapshot.ts.
 *
 * app.navigation.ts needs a single service-tag href for a static nav link. Importing that
 * from service-tags-snapshot.ts put the whole module - shared with several lazy routes -
 * into a chunk that reached the initial bundle. This module holds only string building, so
 * the nav link no longer drags snapshot parsing into initial.
 *
 * Keep this free of imports from service-tags-snapshot.ts, or the shared chunk comes back.
 */

/** Cloud ids, structurally identical to ServiceTagCloud in service-tags-snapshot.ts. */
type ServiceTagCloudId = 'public' | 'china' | 'usgovernment'

/**
 * Region ids whose AzureCloud.<region> service tag uses an abbreviated spelling that does
 * not match the Azure region id.
 */
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

/** Href for the top-level AzureCloud service tag, used by the static nav link. */
export const AZURE_CLOUD_SERVICE_TAG_HREF = '/Information/AzureIpRanges/AzureCloud'

export function buildServiceTagHref(
  cloud: ServiceTagCloudId,
  serviceTagId: string,
  requiresCloudRoute = cloud !== 'public'
): string {
  const encodedServiceTagId = encodeURIComponent(serviceTagId)
  return cloud === 'public' || !requiresCloudRoute
    ? `/Information/AzureIpRanges/${encodedServiceTagId}`
    : `/Information/AzureIpRanges/${cloud}/${encodedServiceTagId}`
}

export function buildAzureCloudRegionServiceTagHref(regionId: string): string {
  const normalizedRegionId = regionId.trim().toLowerCase()
  const serviceTagRegionId =
    AZURE_CLOUD_SERVICE_TAG_REGION_ALIASES[normalizedRegionId] ?? normalizedRegionId
  return buildServiceTagHref('public', `AzureCloud.${serviceTagRegionId}`, false)
}
