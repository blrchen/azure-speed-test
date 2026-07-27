import { Component, inject, OnInit } from '@angular/core'

import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildRegionDetailHref } from '../../../shared/utils'

@Component({
  selector: 'app-azure-availability-zones',
  imports: [LucideIconComponent],
  templateUrl: './azure-availability-zones.component.html',
  host: { class: 'block' },
})
export class AzureAvailabilityZonesComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  readonly tableData = azureGlobalCloudRegionsJson.filter(
    (region) => region.availabilityZoneCount > 0
  )
  protected readonly buildRegionDetailHref = buildRegionDetailHref

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure Availability Zones',
      description:
        'Learn about Azure Availability Zones, separate locations within an Azure region, each containing datacenters with independent power, cooling, and networking infrastructure.',
      canonicalUrl: 'https://www.azurespeed.com/Information/AzureAvailabilityZones',
    })
  }
}
