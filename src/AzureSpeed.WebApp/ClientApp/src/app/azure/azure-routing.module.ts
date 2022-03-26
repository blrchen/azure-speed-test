import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
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
  UploadLargeFileComponent,
} from ".";

const routes: Routes = [
  {
    path: "",
    component: AzureComponent,
    children: [
      {
        path: "About",
        data: { title: "About" },
        component: AboutComponent,
      },
      {
        path: "CDN",
        data: { title: "Azure CDN Speed Test" },
        component: CDNComponent,
      },
      {
        path: "Download",
        data: { title: "Azure Storage Blob Download Speed Test" },
        component: DownloadComponent,
      },
      {
        path: "IPLookup",
        data: { title: "Azure IP Lookup" },
        component: IPLookupComponent,
      },
      {
        path: "Latency",
        data: { title: "Azure Latency Test" },
        component: LatencyComponent,
      },
      {
        path: "PsPing",
        data: { title: "PsPing Network Latency Test" },
        component: PSPingComponent,
      },
      {
        path: "RegionToRegionLatency",
        data: { title: "Azure Region to Region Latency" },
        component: RegionToRegionLatencyComponent,
      },
      {
        path: "Upload",
        data: { title: "Azure Storage Blob Upload Speed Test" },
        component: UploadComponent,
      },
      {
        path: "UploadLargeFile",
        data: { title: "Azure Storage Large File Upload Speed Test" },
        component: UploadLargeFileComponent,
      },
      {
        path: "**",
        redirectTo: "Latency",
        pathMatch: "full",
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AzureRoutingModule {}
