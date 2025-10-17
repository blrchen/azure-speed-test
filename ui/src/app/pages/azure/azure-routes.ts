import { Routes } from '@angular/router'

export const AZURE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./azure.component').then((_) => _.AzureComponent),
    children: [
      {
        path: 'About',
        loadComponent: () => import('./about/about.component').then((_) => _.AboutComponent)
      },
      {
        path: 'CDN',
        loadComponent: () => import('./cdn/cdn.component').then((_) => _.CDNComponent)
      },
      {
        path: 'Download',
        loadComponent: () =>
          import('./download/download.component').then((_) => _.DownloadComponent)
      },
      {
        path: 'IPLookup',
        loadComponent: () =>
          import('./ip-lookup/ip-lookup.component').then((_) => _.IPLookupComponent)
      },
      {
        path: 'IPLookup/:ipOrDomain',
        loadComponent: () =>
          import('./ip-lookup/ip-lookup.component').then((_) => _.IPLookupComponent)
      },
      {
        path: 'Latency',
        loadComponent: () => import('./latency/latency.component').then((_) => _.LatencyComponent)
      },
      {
        path: 'PsPing',
        loadComponent: () => import('./psPing/psPing.component').then((_) => _.PSPingComponent)
      },
      {
        path: 'RegionToRegionLatency',
        loadComponent: () =>
          import('./region-to-region-latency/region-to-region-latency.component').then(
            (_) => _.RegionToRegionLatencyComponent
          )
      },
      {
        path: 'Upload',
        loadComponent: () => import('./upload/upload.component').then((_) => _.UploadComponent)
      },
      {
        path: 'UploadLargeFile',
        loadComponent: () =>
          import('./upload-large-file/upload-large-file.component').then(
            (_) => _.UploadLargeFileComponent
          )
      },
      {
        path: '**',
        redirectTo: 'Latency',
        pathMatch: 'full'
      }
    ]
  }
]
