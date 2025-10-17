import { Routes } from '@angular/router'

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
          )
      },
      {
        path: 'AzureEnvironments',
        loadComponent: () =>
          import('./azure-environments/azure-environments.component').then(
            (_) => _.AzureEnvironmentsComponent
          )
      },
      {
        path: 'AzureGeographies',
        loadComponent: () =>
          import('./azure-geographies/azure-geographies.component').then(
            (_) => _.AzureGeographiesComponent
          )
      },
      {
        path: 'AzureIpRanges',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./azure-ip-ranges/azure-ip-ranges.component').then(
                (_) => _.AzureIpRangesComponent
              ),
            pathMatch: 'full'
          },
          {
            path: ':serviceTagId',
            loadComponent: () =>
              import('./azure-ip-ranges/azure-ip-ranges.component').then(
                (_) => _.AzureIpRangesComponent
              )
          }
        ]
      },
      {
        path: 'AzureIpRangesByRegion',
        loadComponent: () =>
          import('./azure-ip-ranges-by-region/azure-ip-ranges-by-region.component').then(
            (_) => _.AzureIpRangesByRegionComponent
          )
      },
      {
        path: 'AzureIpRangesByService',
        loadComponent: () =>
          import('./azure-ip-ranges-by-service/azure-ip-ranges-by-service.component').then(
            (_) => _.AzureIpRangesByServiceComponent
          )
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
            pathMatch: 'full'
          },
          {
            path: ':regionId',
            loadComponent: () =>
              import('./azure-region-details/azure-region-details.component').then(
                (_) => _.AzureRegionDetailsComponent
              )
          }
        ]
      },
      {
        path: 'AzureSovereignClouds',
        loadComponent: () =>
          import('./azure-sovereign-clouds/azure-sovereign-clouds.component').then(
            (_) => _.AzureSovereignCloudsComponent
          )
      },
      {
        path: 'AzureChinaRegions',
        loadComponent: () =>
          import('./azure-china-regions/azure-china-regions.component').then(
            (_) => _.AzureChinaRegionsComponent
          )
      },
      {
        path: 'AzureUSGovernmentRegions',
        loadComponent: () =>
          import('./azure-us-government-regions/azure-us-government-regions.component').then(
            (_) => _.AzureUSGovernmentRegionsComponent
          )
      },
      {
        path: '**',
        loadComponent: () =>
          import('../shared/not-found/not-found.component').then((_) => _.NotFoundComponent)
      }
    ]
  }
]
