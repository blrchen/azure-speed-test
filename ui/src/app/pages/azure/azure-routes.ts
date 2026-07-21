import { Routes } from '@angular/router'

import { confirmDownloadSpeedTestNavigation } from './download/download.guard'
import { confirmLargeFileUploadNavigation } from './upload-large-file/upload-large-file.guard'
import { confirmUploadSpeedTestNavigation } from './upload/upload.guard'

export const AZURE_ROUTES: Routes = [
  {
    path: 'About',
    loadComponent: () => import('./about/about.component').then((_) => _.AboutComponent),
  },
  {
    path: 'CDN',
    loadComponent: () => import('./cdn/cdn.component').then((_) => _.CDNComponent),
  },
  {
    path: 'Download',
    canDeactivate: [confirmDownloadSpeedTestNavigation],
    loadComponent: () => import('./download/download.component').then((_) => _.DownloadComponent),
  },
  {
    path: 'DownloadTestFile',
    loadComponent: () =>
      import('./download-test-file/download-test-file.component').then(
        (_) => _.DownloadTestFileComponent
      ),
  },
  {
    path: 'IPLookup',
    loadComponent: () => import('./ip-lookup/ip-lookup.component').then((_) => _.IPLookupComponent),
  },
  {
    path: 'IPLookup/:ipOrDomain',
    loadComponent: () => import('./ip-lookup/ip-lookup.component').then((_) => _.IPLookupComponent),
  },
  {
    path: 'Latency',
    loadComponent: () => import('./latency/latency.component').then((_) => _.LatencyComponent),
  },
  {
    path: 'PsPing',
    loadComponent: () => import('./psPing/psPing.component').then((_) => _.PSPingComponent),
  },
  {
    path: 'RegionToRegionLatency',
    loadComponent: () =>
      import('./region-to-region-latency/region-to-region-latency.component').then(
        (_) => _.RegionToRegionLatencyComponent
      ),
  },
  {
    path: 'RegionToRegionLatency/:sourceRegion',
    loadComponent: () =>
      import('./region-to-region-latency/region-to-region-latency.component').then(
        (_) => _.RegionToRegionLatencyComponent
      ),
  },
  {
    path: 'Upload',
    canDeactivate: [confirmUploadSpeedTestNavigation],
    loadComponent: () => import('./upload/upload.component').then((_) => _.UploadComponent),
  },
  {
    path: 'UploadLargeFile',
    canDeactivate: [confirmLargeFileUploadNavigation],
    loadComponent: () =>
      import('./upload-large-file/upload-large-file.component').then(
        (_) => _.UploadLargeFileComponent
      ),
  },
  {
    path: '',
    redirectTo: 'Latency',
    pathMatch: 'full',
  },
]
