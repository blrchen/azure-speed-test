import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import {
  AzureAvailabilityZonesComponent,
  AzureEnvironmentsComponent,
  AzureGeographiesComponent,
  AzureIpRangesByRegionComponent,
  AzureIpRangesByServiceComponent,
  AzureIpRangesComponent,
  AzureRegionDetailsComponent,
  AzureRegionsComponent,
  AzureSovereignCloudsComponent
} from './index'
import { SharedModule } from '../shared/shared.module'
import { InformationRoutingModule } from './information-routing.module'
import { InformationComponent } from './information.component'

@NgModule({
  bootstrap: [],
  declarations: [
    AzureAvailabilityZonesComponent,
    AzureEnvironmentsComponent,
    AzureGeographiesComponent,
    AzureIpRangesComponent,
    AzureIpRangesByRegionComponent,
    AzureIpRangesByServiceComponent,
    AzureRegionDetailsComponent,
    AzureRegionsComponent,
    AzureSovereignCloudsComponent,
    InformationComponent
  ],
  exports: [],
  imports: [CommonModule, InformationRoutingModule, SharedModule],
  providers: []
})
export class InformationModule {}
