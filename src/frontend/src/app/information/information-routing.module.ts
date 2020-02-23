import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import {
  AzureAvailabilityZonesComponent,
  AzureBillingMetersComponent,
  AzureEnvironmentsComponent,
  AzureGeographiesComponent,
  AzureRegionsComponent,
  AzureSovereignCloudsComponent,
  AzureVMPricingComponent,
  IpRangeComponent,
  ReferencesComponent
} from "../information";
import { InformationComponent } from "./information.component";
import { NotFoundComponent } from "../shared";

const routes: Routes = [
  {
    path: "",
    component: InformationComponent,
    children: [
      {
        path: "AzureAvailabilityZones",
        component: AzureAvailabilityZonesComponent
      },
      {
        path: "AzureBillingMeters",
        component: AzureBillingMetersComponent
      },
      {
        path: "AzureEnvironments",
        component: AzureEnvironmentsComponent
      },
      {
        path: "AzureGeographies",
        component: AzureGeographiesComponent
      },
      {
        path: "AzureRegions",
        component: AzureRegionsComponent
      },
      {
        path: "AzureSovereignClouds",
        component: AzureSovereignCloudsComponent
      },
      {
        path: "AzureVMPricing",
        component: AzureVMPricingComponent
      },
      {
        path: "IpRange",
        component: IpRangeComponent
      },
      {
        path: "References",
        component: ReferencesComponent
      },
      {
        path: "**",
        component: NotFoundComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InformationRoutingModule {}
