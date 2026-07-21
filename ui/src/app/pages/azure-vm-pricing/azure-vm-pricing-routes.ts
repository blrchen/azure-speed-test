import { Routes } from '@angular/router'

import {
  vmCatalogDirectoryResolver,
  vmComparisonResolver,
  vmRegionDetailResolver,
  vmRegionDirectoryResolver,
  vmSeriesDetailResolver,
  vmSeriesDirectoryResolver,
  vmSkuDetailResolver,
} from '../../services/vm-catalog-resolver'

export const AZURE_VM_PRICING_ROUTES: Routes = [
  {
    path: '',
    resolve: {
      vmCatalog: vmCatalogDirectoryResolver,
    },
    loadComponent: () => import('./azure-vm-sizes/azure-vm-sizes').then((_) => _.AzureVmSizes),
    pathMatch: 'full',
  },
  {
    path: 'Compare',
    resolve: {
      vmComparisonPageData: vmComparisonResolver,
    },
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('./azure-vm-comparison/azure-vm-comparison').then((_) => _.AzureVmComparison),
  },
  {
    path: 'Series',
    children: [
      {
        path: '',
        resolve: {
          vmSeriesDirectory: vmSeriesDirectoryResolver,
        },
        loadComponent: () =>
          import('./azure-vm-family-directory/azure-vm-family-directory').then(
            (_) => _.AzureVmFamilyDirectory
          ),
        pathMatch: 'full',
      },
      {
        path: ':seriesSlug',
        resolve: {
          vmSeriesPageData: vmSeriesDetailResolver,
        },
        loadComponent: () =>
          import('./azure-vm-family-sizes/azure-vm-family-sizes').then((_) => _.AzureVmFamilySizes),
      },
    ],
  },
  {
    path: 'Regions',
    children: [
      {
        path: '',
        resolve: {
          vmRegionDirectory: vmRegionDirectoryResolver,
        },
        loadComponent: () =>
          import('./azure-vm-region-directory/azure-vm-region-directory').then(
            (_) => _.AzureVmRegionDirectory
          ),
        pathMatch: 'full',
      },
      {
        path: ':armRegionName',
        resolve: {
          vmRegionPageData: vmRegionDetailResolver,
        },
        loadComponent: () =>
          import('./azure-vm-region-sizes/azure-vm-region-sizes').then((_) => _.AzureVmRegionSizes),
      },
    ],
  },
  {
    path: ':armSkuName',
    resolve: {
      vmSkuPageData: vmSkuDetailResolver,
    },
    loadComponent: () =>
      import('./azure-vm-sku-details/azure-vm-sku-details').then((_) => _.AzureVmSkuDetails),
  },
]
