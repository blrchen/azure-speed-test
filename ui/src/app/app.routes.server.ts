import { readFileSync } from 'fs'
import { join } from 'path'
import { RenderMode, ServerRoute } from '@angular/ssr'

import { SERVICE_IP_RANGE_DIRECTORY } from './pages/information/azure-ip-ranges-by-service/service-ip-ranges.data'
import { toRegionNameNoSpace } from './shared/utils'

interface Region {
  displayName: string
}

// Sovereign cloud regions not in regions.json but available on production
const SOVEREIGN_CLOUD_REGIONS = [
  'ChinaEast',
  'ChinaEast2',
  'ChinaEast3',
  'ChinaNorth',
  'ChinaNorth2',
  'ChinaNorth3',
  'USDoDCentral',
  'USDoDEast',
  'USGovArizona',
  'USGovTexas',
  'USGovVirginia'
]

// AzureCloud regional service tags use these region identifiers
// Some use abbreviated names that differ from regions.json
const AZURE_CLOUD_REGIONS = [
  'australiacentral',
  'australiacentral2',
  'australiaeast',
  'australiasoutheast',
  'austriaeast',
  'belgiumcentral',
  'brazilne',
  'brazilse',
  'brazilsouth',
  'canadacentral',
  'canadaeast',
  'centralfrance',
  'centralindia',
  'centralus',
  'centraluseuap',
  'chilec',
  'chinaeast',
  'chinaeast2',
  'chinaeast3',
  'chinanorth',
  'chinanorth2',
  'chinanorth3',
  'eastasia',
  'eastus',
  'eastus2',
  'eastus2euap',
  'germanyn',
  'germanywc',
  'indonesiacentral',
  'israelcentral',
  'israelnorthwest',
  'italynorth',
  'japaneast',
  'japanwest',
  'jioindiacentral',
  'jioindiawest',
  'koreacentral',
  'koreasouth',
  'malaysiasouth',
  'malaysiawest',
  'mexicocentral',
  'newzealandnorth',
  'northcentralus',
  'northeurope',
  'northeurope2',
  'norwaye',
  'norwayw',
  'polandcentral',
  'qatarcentral',
  'southafricanorth',
  'southafricawest',
  'southcentralus',
  'southcentralus2',
  'southeastasia',
  'southeastus',
  'southeastus3',
  'southfrance',
  'southindia',
  'spaincentral',
  'swedencentral',
  'swedensouth',
  'switzerlandn',
  'switzerlandw',
  'taiwannorth',
  'taiwannorthwest',
  'uaecentral',
  'uaenorth',
  'uksouth',
  'ukwest',
  'usdodcentral',
  'usdodeast',
  'usgovarizona',
  'usgoviowa',
  'usgovtexas',
  'usgovvirginia',
  'usstagec',
  'usstagee',
  'westcentralus',
  'westeurope',
  'westindia',
  'westus',
  'westus2',
  'westus3'
]

function getRegions(): Region[] {
  try {
    const regionsPath = join(process.cwd(), 'src', 'assets', 'data', 'regions.json')
    return JSON.parse(readFileSync(regionsPath, 'utf8'))
  } catch {
    return []
  }
}

function getServiceTagIds(): string[] {
  const serviceTagIds: string[] = []
  for (const entry of SERVICE_IP_RANGE_DIRECTORY) {
    serviceTagIds.push(...entry.ranges)
  }
  // Add AzureCloud base tag and regional service tags
  serviceTagIds.push('AzureCloud')
  for (const region of AZURE_CLOUD_REGIONS) {
    serviceTagIds.push(`AzureCloud.${region}`)
  }
  return serviceTagIds
}

export const serverRoutes: ServerRoute[] = [
  // Dynamic route - use Server rendering (not prerender)
  {
    path: 'Azure/IPLookup/:ipOrDomain',
    renderMode: RenderMode.Server
  },
  // Prerender all service tag pages
  {
    path: 'Information/AzureIpRanges/:serviceTagId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const serviceTagIds = getServiceTagIds()
      return serviceTagIds.map((serviceTagId) => ({ serviceTagId }))
    }
  },
  // Prerender all region detail pages with PascalCase URLs (e.g., AustraliaCentral)
  {
    path: 'Information/AzureRegions/:regionId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const regions = getRegions()
      const regionIds = regions.map((region) => toRegionNameNoSpace(region.displayName))
      // Add sovereign cloud regions not in regions.json
      regionIds.push(...SOVEREIGN_CLOUD_REGIONS)
      return regionIds.map((regionId) => ({ regionId }))
    }
  },
  // Prerender all other static routes
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
]
