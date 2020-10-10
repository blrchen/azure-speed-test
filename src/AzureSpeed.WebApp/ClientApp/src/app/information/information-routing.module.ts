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
  AzureIpRangeComponent,
  ReferencesComponent,
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
        data: { title: "Azure Availability Zones" },
        component: AzureAvailabilityZonesComponent,
      },
      {
        path: "AzureBillingMeters",
        data: { title: "Azure Billing Meters" },
        component: AzureBillingMetersComponent,
      },
      {
        path: "AzureEnvironments",
        data: { title: "Azure Environments" },
        component: AzureEnvironmentsComponent,
      },
      {
        path: "AzureGeographies",
        data: { title: "Azure Geographies" },
        component: AzureGeographiesComponent,
      },
      {
        path: "AzureIpRanges",
        data: { title: "Azure IP Ranges" },
        component: AzureIpRangeComponent,
      },
      {
        path: "AzureRegions",
        data: { title: "Azure Regions" },
        component: AzureRegionsComponent,
      },
      {
        path: "AzureSovereignClouds",
        data: { title: "Azure Sovereign Clouds" },
        component: AzureSovereignCloudsComponent,
      },
      {
        path: "AzureVMPricing",
        data: { title: "Azure Virtual Machine Pricing" },
        component: AzureVMPricingComponent,
      },

      {
        path: "References",
        data: { title: "References" },
        component: ReferencesComponent,
      },
      {
        path: "**",
        component: NotFoundComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InformationRoutingModule {}
