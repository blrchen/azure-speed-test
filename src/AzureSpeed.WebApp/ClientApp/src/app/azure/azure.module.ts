import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { LineChartModule } from "@swimlane/ngx-charts";
import { NgbModalModule } from "@ng-bootstrap/ng-bootstrap";
import { SharedModule } from "../shared/shared.module";
import { AzureRoutingModule } from "./azure-routing.module";
import { AzureComponent } from "./azure.component";
import {
  AboutComponent,
  CDNComponent,
  DownloadComponent,
  IPLookupComponent,
  LatencyComponent,
  PSPingComponent,
  RegionToRegionLatencyComponent,
  UploadComponent,
  UploadLargeFileComponent,
} from ".";

@NgModule({
  declarations: [
    AboutComponent,
    CDNComponent,
    DownloadComponent,
    IPLookupComponent,
    LatencyComponent,
    PSPingComponent,
    RegionToRegionLatencyComponent,
    AzureComponent,
    UploadComponent,
    UploadLargeFileComponent,
  ],
  imports: [CommonModule, AzureRoutingModule, SharedModule, HttpClientModule, LineChartModule, NgbModalModule, FormsModule],
  providers: [],
  bootstrap: [],
  entryComponents: [AzureComponent],
  exports: [],
})
export class AzureModule {}
