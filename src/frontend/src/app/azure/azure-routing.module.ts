import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import {
  AboutComponent,
  CDNComponent,
  DownloadComponent,
  IPLookupComponent,
  LatencyComponent,
  PSPingComponent,
  RegionFinderComponent,
  RegionToRegionLatencyComponent,
  UploadComponent,
  UploadLargeFileComponent
} from "../azure";
import { AzureComponent } from "./azure.component";
import { NotFoundComponent } from "../shared";

const routes: Routes = [
  {
    path: "",
    component: AzureComponent,
    children: [
      {
        path: "About",
        component: AboutComponent
      },
      {
        path: "CDN",
        component: CDNComponent
      },
      {
        path: "Download",
        component: DownloadComponent
      },
      {
        path: "IPLookup",
        component: IPLookupComponent
      },
      {
        path: "Latency",
        component: LatencyComponent
      },
      {
        path: "PsPing",
        component: PSPingComponent
      },
      {
        path: "RegionFinder",
        component: RegionFinderComponent
      },
      {
        path: "RegionToRegionLatency",
        component: RegionToRegionLatencyComponent
      },
      {
        path: "Upload",
        component: UploadComponent
      },
      {
        path: "UploadLargeFile",
        component: UploadLargeFileComponent
      },
      {
        path: "**",
        redirectTo: "Latency",
        pathMatch: "full"
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AzureRoutingModule {}
