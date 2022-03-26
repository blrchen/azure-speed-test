import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import {
  AzureAvailabilityZonesComponent,
  AzureEnvironmentsComponent,
  AzureGeographiesComponent,
  AzureRegionsComponent,
  AzureSovereignCloudsComponent,
  AzureIpRangeComponent,
} from "../information";
import { SharedModule } from "../shared/shared.module";
import { InformationRoutingModule } from "./information-routing.module";
import { InformationComponent } from "./information.component";

@NgModule({
  declarations: [
    AzureAvailabilityZonesComponent,
    AzureEnvironmentsComponent,
    AzureGeographiesComponent,
    AzureRegionsComponent,
    AzureSovereignCloudsComponent,
    InformationComponent,
    AzureIpRangeComponent,
  ],
  imports: [CommonModule, InformationRoutingModule, SharedModule],
  providers: [],
  bootstrap: [],
  entryComponents: [InformationComponent],
  exports: [],
})
export class InformationModule {}
