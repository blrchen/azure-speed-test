import { Component, inject, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'

import upcomingRegionsJson from '../../../../assets/data/regions-upcoming.json'
import { UpcomingRegion } from '../../../models'
import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-azure-upcoming-regions',
  imports: [RouterLink, LucideIconComponent],
  templateUrl: './azure-upcoming-regions.component.html',
  host: { class: 'block' },
})
export class AzureUpcomingRegionsComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  readonly upcomingRegions = upcomingRegionsJson as UpcomingRegion[]

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure Upcoming Regions Planned Datacenter Locations',
      description:
        'List of upcoming Azure regions with planned datacenter locations and official announcement links.',
      canonicalUrl: 'https://www.azurespeed.com/Information/AzureUpcomingRegions',
    })
  }
}
