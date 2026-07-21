import { Routes } from '@angular/router'

import {
  azureIpRangesRegionDirectoryResolver,
  azureIpRangesResolver,
  azureIpRangesServiceDirectoryResolver,
} from '../../services/service-tags-resolvers'

export const INFORMATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./information.component').then((_) => _.InformationComponent),
    children: [
      {
        path: 'AzureAvailabilityZones',
        loadComponent: () =>
          import('./azure-availability-zones/azure-availability-zones.component').then(
            (_) => _.AzureAvailabilityZonesComponent
          ),
      },
      {
        path: 'AzureEnvironments',
        loadComponent: () =>
          import('./azure-environments/azure-environments.component').then(
            (_) => _.AzureEnvironmentsComponent
          ),
      },
      {
        path: 'AzureGeographies',
        loadComponent: () =>
          import('./azure-geographies/azure-geographies.component').then(
            (_) => _.AzureGeographiesComponent
          ),
      },
      {
        path: 'AzureIpRanges',
        children: [
          {
            path: '',
            resolve: {
              serviceTagPageData: azureIpRangesResolver,
            },
            loadComponent: () =>
              import('./service-tags/azure-ip-ranges/azure-ip-ranges.component').then(
                (_) => _.AzureIpRangesComponent
              ),
            pathMatch: 'full',
          },
          {
            path: ':cloud/:serviceTagId',
            resolve: {
              serviceTagPageData: azureIpRangesResolver,
            },
            loadComponent: () =>
              import('./service-tags/azure-ip-ranges/azure-ip-ranges.component').then(
                (_) => _.AzureIpRangesComponent
              ),
          },
          {
            path: ':serviceTagId',
            resolve: {
              serviceTagPageData: azureIpRangesResolver,
            },
            loadComponent: () =>
              import('./service-tags/azure-ip-ranges/azure-ip-ranges.component').then(
                (_) => _.AzureIpRangesComponent
              ),
          },
        ],
      },
      {
        path: 'AzureIpRangesByRegion',
        resolve: {
          serviceTagDirectories: azureIpRangesRegionDirectoryResolver,
        },
        loadComponent: () =>
          import('./service-tags/azure-ip-ranges-by-region/azure-ip-ranges-by-region.component').then(
            (_) => _.AzureIpRangesByRegionComponent
          ),
      },
      {
        path: 'AzureIpRangesByService',
        resolve: {
          serviceTagDirectories: azureIpRangesServiceDirectoryResolver,
        },
        loadComponent: () =>
          import('./service-tags/azure-ip-ranges-by-service/azure-ip-ranges-by-service.component').then(
            (_) => _.AzureIpRangesByServiceComponent
          ),
      },
      {
        path: 'AzureUpcomingRegions',
        loadComponent: () =>
          import('./azure-upcoming-regions/azure-upcoming-regions.component').then(
            (_) => _.AzureUpcomingRegionsComponent
          ),
      },
      {
        path: 'AzureRegionMap',
        data: { shellWidth: 'full' },
        loadComponent: () =>
          import('./azure-region-map/azure-region-map.component').then(
            (_) => _.AzureRegionMapComponent
          ),
      },
      {
        path: 'AzureRestrictedRegions',
        loadComponent: () =>
          import('./azure-restricted-regions/azure-restricted-regions.component').then(
            (_) => _.AzureRestrictedRegionsComponent
          ),
      },
      {
        path: 'AzureRegions',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./azure-regions/azure-regions.component').then(
                (_) => _.AzureRegionsComponent
              ),
            pathMatch: 'full',
          },
          {
            path: ':regionId',
            loadComponent: () =>
              import('./azure-region-details/azure-region-details.component').then(
                (_) => _.AzureRegionDetailsComponent
              ),
          },
        ],
      },
      {
        path: 'AzureSovereignClouds',
        loadComponent: () =>
          import('./azure-sovereign-clouds/azure-sovereign-clouds.component').then(
            (_) => _.AzureSovereignCloudsComponent
          ),
      },
      {
        path: 'AzureChinaRegions',
        loadComponent: () =>
          import('./azure-china-regions/azure-china-regions.component').then(
            (_) => _.AzureChinaRegionsComponent
          ),
      },
      {
        path: 'AzureUSGovernmentRegions',
        loadComponent: () =>
          import('./azure-us-government-regions/azure-us-government-regions.component').then(
            (_) => _.AzureUSGovernmentRegionsComponent
          ),
      },
      {
        path: '**',
        loadComponent: () =>
          import('../shared/not-found/not-found.component').then((_) => _.NotFoundComponent),
      },
    ],
  },
]
