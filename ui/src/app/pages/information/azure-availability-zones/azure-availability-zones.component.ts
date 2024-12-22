import { Component, OnInit } from '@angular/core'
import { Region } from '../../../models'
import data from '../../../../assets/data/regions.json'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-azure-availability-zones',
  templateUrl: './azure-availability-zones.component.html'
})
export class AzureAvailabilityZonesComponent implements OnInit {
  tableData: Region[] = []

  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  ngOnInit() {
    this.tableData = data.filter((region) => region.availabilityZoneCount > 0)
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Availability Zones')
    this.seoService.setMetaDescription(
      'Learn about Azure Availability Zones, separate locations within an Azure region, each containing datacenters with independent power, cooling, and networking infrastructure.'
    )
    this.seoService.setMetaKeywords(
      'Azure, Azure Availability Zones, Azure Regions, Azure Datacenters, Azure resiliency'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureAvailabilityZones')
  }
}
