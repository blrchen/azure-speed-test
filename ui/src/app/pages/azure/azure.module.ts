import { CommonModule, NgOptimizedImage } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { LineChartModule } from '@swimlane/ngx-charts'
import { SharedModule } from '../shared/shared.module'
import { AzureRoutingModule } from './azure-routing.module'
import { AzureComponent } from './azure.component'
import {
  AboutComponent,
  CDNComponent,
  DownloadComponent,
  IPLookupComponent,
  LatencyComponent,
  PSPingComponent,
  RegionToRegionLatencyComponent,
  UploadComponent,
  UploadLargeFileComponent
} from './index'

@NgModule({
  bootstrap: [],
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
    UploadLargeFileComponent
  ],
  exports: [],
  imports: [
    CommonModule,
    AzureRoutingModule,
    SharedModule,
    LineChartModule,
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage
  ],
  providers: []
})
export class AzureModule {}
