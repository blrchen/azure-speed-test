import { buildServiceTagHref } from './services/service-tags-snapshot'
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
        routerLink: APP_HOME_LINK,
      },
      {
        label: 'Region to Region Latency',
        icon: 'arrow-left-right',
        routerLink: '/Azure/RegionToRegionLatency',
        activeMatchOptions: NAV_SUBSET_MATCH_OPTIONS,
      },
      {
        label: 'PsPing Network Latency Test',
        icon: 'signal-high',
        routerLink: '/Azure/PsPing',
      },
      {
        label: 'Download Speed Test',
        icon: 'download',
        routerLink: '/Azure/Download',
      },
      {
        label: 'Download Test Files',
        icon: 'file-text',
        routerLink: '/Azure/DownloadTestFile',
      },
      {
        label: 'Upload Speed Test',
        icon: 'upload',
        routerLink: '/Azure/Upload',
      },
      {
        label: 'Large File Upload Speed Test',
        icon: 'upload-cloud',
        routerLink: '/Azure/UploadLargeFile',
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
        routerLink: '/AzureVmPricing',
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
        routerLink: '/Information/AzureRegions',
        activeMatchOptions: NAV_SUBSET_MATCH_OPTIONS,
      },
      {
        label: 'Azure Region Map',
        icon: 'map',
        routerLink: '/Information/AzureRegionMap',
      },
      {
        label: 'Azure Availability Zones',
        icon: 'server',
        routerLink: '/Information/AzureAvailabilityZones',
      },
      {
        label: 'Azure Geographies',
        icon: 'globe',
        routerLink: '/Information/AzureGeographies',
      },
      {
        label: 'Azure Sovereign Clouds',
        icon: 'cloud',
        routerLink: '/Information/AzureSovereignClouds',
      },
      {
        label: 'Azure Environments',
        icon: 'cog',
        routerLink: '/Information/AzureEnvironments',
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
        routerLink: '/Azure/IPLookup',
        activeMatchOptions: NAV_SUBSET_MATCH_OPTIONS,
      },
      {
        label: 'Azure IP Ranges',
        icon: 'map',
        routerLink: buildServiceTagHref('public', 'AzureCloud', false),
        documentNavigation: true,
        activeMatchOptions: NAV_SUBSET_MATCH_OPTIONS,
      },
      {
        label: 'Azure IP Ranges By Region',
        icon: 'map-pin',
        routerLink: '/Information/AzureIpRangesByRegion',
      },
      {
        label: 'Azure IP Ranges By Service',
        icon: 'bar-chart-3',
        routerLink: '/Information/AzureIpRangesByService',
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
        routerLink: '/Azure/About',
      },
    ],
  },
]
