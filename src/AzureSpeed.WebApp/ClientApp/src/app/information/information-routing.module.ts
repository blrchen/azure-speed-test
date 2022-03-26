import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { NotFoundComponent } from "../shared";
import {
  AzureAvailabilityZonesComponent,
  AzureEnvironmentsComponent,
  AzureGeographiesComponent,
  AzureRegionsComponent,
  AzureSovereignCloudsComponent,
  AzureIpRangeComponent,
  InformationComponent,
} from ".";

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
