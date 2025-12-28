import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'

import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildRegionDetailRouterLink } from '../../../shared/utils'

@Component({
  selector: 'app-azure-availability-zones',
  imports: [RouterLink, LucideIconComponent],
  templateUrl: './azure-availability-zones.component.html',
  styleUrl: './azure-availability-zones.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureAvailabilityZonesComponent implements OnInit {
  readonly tableData = computed(() =>
    (azureGlobalCloudRegionsJson as Region[]).filter(
      (region) => (region.availabilityZoneCount ?? 0) > 0
    )
  )
  protected readonly buildRegionRouterLink = buildRegionDetailRouterLink

  private readonly seoService = inject(SeoService)

  ngOnInit() {
    this.seoService.setMetaTitle('Azure Availability Zones')
    this.seoService.setMetaDescription(
      'Learn about Azure Availability Zones, separate locations within an Azure region, each containing datacenters with independent power, cooling, and networking infrastructure.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureAvailabilityZones')
  }
}
