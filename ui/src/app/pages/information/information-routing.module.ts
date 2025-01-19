import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { NotFoundComponent } from '../shared'
import {
  AzureAvailabilityZonesComponent,
  AzureEnvironmentsComponent,
  AzureGeographiesComponent,
  AzureIpRangesByRegionComponent,
  AzureIpRangesByServiceComponent,
  AzureIpRangesComponent,
  AzureRegionsComponent,
  AzureRegionDetailsComponent,
  AzureSovereignCloudsComponent,
  InformationComponent
} from './index'
import { AzureIpRangesResolver } from './azure-ip-ranges/azure-ip-ranges-resolver.service'

const routes: Routes = [
  {
    path: '',
    component: InformationComponent,
    children: [
      {
        path: 'AzureAvailabilityZones',
        component: AzureAvailabilityZonesComponent
      },
      {
        path: 'AzureEnvironments',
        component: AzureEnvironmentsComponent
      },
      {
        path: 'AzureGeographies',
        component: AzureGeographiesComponent
      },
      {
        path: 'AzureIpRanges',
        children: [
          {
            path: '',
            component: AzureIpRangesComponent,
            pathMatch: 'full'
          },
          {
            path: ':serviceTagId',
            component: AzureIpRangesComponent,
            resolve: { tableData: AzureIpRangesResolver }
          }
        ]
      },
      {
        path: 'AzureIpRangesByRegion',
        component: AzureIpRangesByRegionComponent
      },
      {
        path: 'AzureIpRangesByService',
        component: AzureIpRangesByServiceComponent
      },
      {
        path: 'AzureRegions',
        children: [
          {
            path: '',
            component: AzureRegionsComponent,
            pathMatch: 'full'
          },
          {
            path: ':regionId',
            component: AzureRegionDetailsComponent
          }
        ]
      },
      {
        path: 'AzureSovereignClouds',
        component: AzureSovereignCloudsComponent
      },
      {
        path: '**',
        component: NotFoundComponent
      }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InformationRoutingModule {}
