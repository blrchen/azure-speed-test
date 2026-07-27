import { AZURE_CLOUD_SERVICE_TAG_HREF } from './services/service-tag-hrefs'
import { NAV_SUBSET_MATCH_OPTIONS, NavGroup } from './shared/nav-groups/nav-groups.component'

export const APP_BRAND_LABEL = 'Azure Speed Test'
export const APP_HOME_LINK = '/Azure/Latency'
export const APP_GITHUB_URL = 'https://github.com/blrchen/azure-speed-test'
export const APP_GITHUB_ARIA_LABEL = 'Azure Speed Test on GitHub'

export const APP_NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'testing',
    heading: 'Testing',
    items: [
      {
        label: 'Azure Latency Test',
        icon: 'zap',
        href: APP_HOME_LINK,
      },
      {
        label: 'Region to Region Latency',
        icon: 'arrow-left-right',
        href: '/Azure/RegionToRegionLatency',
        activeMatchOptions: NAV_SUBSET_MATCH_OPTIONS,
      },
      {
        label: 'PsPing Network Latency Test',
        icon: 'signal-high',
        href: '/Azure/PsPing',
      },
      {
        label: 'Download Speed Test',
        icon: 'download',
        href: '/Azure/Download',
      },
      {
        label: 'Download Test Files',
        icon: 'file-text',
        href: '/Azure/DownloadTestFile',
      },
      {
        label: 'Upload Speed Test',
        icon: 'upload',
        href: '/Azure/Upload',
      },
      {
        label: 'Large File Upload Speed Test',
        icon: 'upload-cloud',
        href: '/Azure/UploadLargeFile',
      },
    ],
  },
  {
    id: 'pricing',
    heading: 'Pricing',
    items: [
      {
        label: 'Azure VM Sizes & Pricing',
        icon: 'database',
        href: '/AzureVmPricing',
        activeMatchOptions: NAV_SUBSET_MATCH_OPTIONS,
      },
      {
        label: 'Azure AI Model Pricing',
        icon: 'sparkles',
        href: '/AzureAiModelPricing',
        activeMatchOptions: NAV_SUBSET_MATCH_OPTIONS,
      },
    ],
  },
  {
    id: 'resources',
    heading: 'Resources',
    items: [
      {
        label: 'Azure Regions',
        icon: 'globe-2',
        href: '/Information/AzureRegions',
        activeMatchOptions: NAV_SUBSET_MATCH_OPTIONS,
      },
      {
        label: 'Azure Region Map',
        icon: 'map',
        href: '/Information/AzureRegionMap',
      },
      {
        label: 'Azure Availability Zones',
        icon: 'server',
        href: '/Information/AzureAvailabilityZones',
      },
      {
        label: 'Azure Geographies',
        icon: 'globe',
        href: '/Information/AzureGeographies',
      },
      {
        label: 'Azure Sovereign Clouds',
        icon: 'cloud',
        href: '/Information/AzureSovereignClouds',
      },
      {
        label: 'Azure Environments',
        icon: 'cog',
        href: '/Information/AzureEnvironments',
      },
    ],
  },
  {
    id: 'ip-tools',
    heading: 'IP Tools',
    items: [
      {
        label: 'Azure IP Lookup',
        icon: 'search',
        href: '/Azure/IPLookup',
        activeMatchOptions: NAV_SUBSET_MATCH_OPTIONS,
      },
      {
        label: 'Azure IP Ranges',
        icon: 'map',
        href: AZURE_CLOUD_SERVICE_TAG_HREF,
        activeMatchOptions: NAV_SUBSET_MATCH_OPTIONS,
      },
      {
        label: 'Azure IP Ranges By Region',
        icon: 'map-pin',
        href: '/Information/AzureIpRangesByRegion',
      },
      {
        label: 'Azure IP Ranges By Service',
        icon: 'bar-chart-3',
        href: '/Information/AzureIpRangesByService',
      },
    ],
  },
  {
    id: 'info',
    heading: 'Info',
    items: [
      {
        label: 'About',
        icon: 'info',
        href: '/Azure/About',
      },
    ],
  },
]
