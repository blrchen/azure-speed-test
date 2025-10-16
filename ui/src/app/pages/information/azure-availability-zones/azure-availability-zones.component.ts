import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { HeroIconComponent } from '../../../shared/icons/hero-icons.imports'

@Component({
  selector: 'app-azure-availability-zones',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroIconComponent],
  templateUrl: './azure-availability-zones.component.html',
  styleUrls: ['./azure-availability-zones.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureAvailabilityZonesComponent implements OnInit {
  readonly tableData = signal<Region[]>([])

  private seoService = inject(SeoService)

  ngOnInit() {
    this.initializeSeoProperties()
    this.tableData.set(
      azureGlobalCloudRegionsJson.filter((region) => region.availabilityZoneCount > 0)
    )
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Availability Zones')
    this.seoService.setMetaDescription(
      'Learn about Azure Availability Zones, separate locations within an Azure region, each containing datacenters with independent power, cooling, and networking infrastructure.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureAvailabilityZones')
  }
}
