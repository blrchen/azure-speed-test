import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { InformationRoutingModule } from "./information-routing.module";
import { InformationComponent } from "./information.component";
import {
  AzureAvailabilityZonesComponent,
  AzureEnvironmentsComponent,
  AzureGeographiesComponent,
  AzureRegionsComponent,
  AzureSovereignCloudsComponent,
  AzureIpRangeComponent,
  ResourcesComponent,
} from "../information";
import { ComponentsModule } from "../shared/components.module";

@NgModule({
  declarations: [
    AzureAvailabilityZonesComponent,
    AzureEnvironmentsComponent,
    AzureGeographiesComponent,
    AzureRegionsComponent,
    AzureSovereignCloudsComponent,
    InformationComponent,
    AzureIpRangeComponent,
    ResourcesComponent,
  ],
  imports: [CommonModule, InformationRoutingModule, ComponentsModule],
  providers: [],
  bootstrap: [],
  entryComponents: [InformationComponent],
  exports: [],
})
export class InformationModule {}
