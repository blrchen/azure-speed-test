import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import {
  AboutComponent,
  AzureComponent,
  CDNComponent,
  DownloadComponent,
  IPLookupComponent,
  LatencyComponent,
  PSPingComponent,
  RegionToRegionLatencyComponent,
  UploadComponent,
  UploadLargeFileComponent
} from './index'

const routes: Routes = [
  {
    path: '',
    component: AzureComponent,
    children: [
      {
        path: 'About',
        component: AboutComponent
      },
      {
        path: 'CDN',
        component: CDNComponent
      },
      {
        path: 'Download',
        component: DownloadComponent
      },
      {
        path: 'IPLookup',
        component: IPLookupComponent
      },
      {
        path: 'Latency',
        component: LatencyComponent
      },
      {
        path: 'PsPing',
        component: PSPingComponent
      },
      {
        path: 'RegionToRegionLatency',
        component: RegionToRegionLatencyComponent
      },
      {
        path: 'Upload',
        component: UploadComponent
      },
      {
        path: 'UploadLargeFile',
        component: UploadLargeFileComponent
      },
      {
        path: '**',
        redirectTo: 'Latency',
        pathMatch: 'full'
      }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AzureRoutingModule {}
