import { RenderMode, ServerRoute } from '@angular/ssr'

import {
  getAzureIpRangeParams,
  getAzureRegionDetailParams,
  getAzureVmRegionParams,
  getAzureVmSeriesParams,
  getAzureVmSkuParams,
  getRegionToRegionLatencyParams,
  getSovereignAzureIpRangeParams,
} from './prerender-params.server'

export const serverRoutes: ServerRoute[] = [
  // Dynamic route - client-side only (no prerender possible for user-provided input)
  {
    path: 'Azure/IPLookup/:ipOrDomain',
    renderMode: RenderMode.Client,
  },
  // Prerender all region-to-region latency pages
  {
    path: 'Azure/RegionToRegionLatency/:sourceRegion',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => Promise.resolve(getRegionToRegionLatencyParams()),
  },
  // Prerender all service tag pages
  {
    path: 'Information/AzureIpRanges/:serviceTagId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => Promise.resolve(getAzureIpRangeParams()),
  },
  {
    path: 'Information/AzureIpRanges/:cloud/:serviceTagId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => Promise.resolve(getSovereignAzureIpRangeParams()),
  },
  // Prerender all region detail pages with PascalCase URLs (e.g., AustraliaCentral)
  {
    path: 'Information/AzureRegions/:regionId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => Promise.resolve(getAzureRegionDetailParams()),
  },
  // Prerender VM series and region catalogs before the generic SKU detail route.
  {
    path: 'AzureVmPricing/Series/:seriesSlug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => Promise.resolve(getAzureVmSeriesParams()),
  },
  {
    path: 'AzureVmPricing/Regions/:armRegionName',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => Promise.resolve(getAzureVmRegionParams()),
  },
  {
    path: 'AzureVmPricing/Compare',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'AzureAiModelPricing/Compare',
    renderMode: RenderMode.Prerender,
  },
  // Prerender one canonical page for every observed ARM VM SKU name.
  {
    path: 'AzureVmPricing/:armSkuName',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => Promise.resolve(getAzureVmSkuParams()),
  },
  // Prerender all other static routes
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
]
