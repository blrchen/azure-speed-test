import { Component, inject, OnInit } from '@angular/core'

import upcomingRegionsJson from '../../../../assets/data/regions-upcoming.json'
import { UpcomingRegion } from '../../../models'
import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { absoluteUrl, buildBreadcrumbList } from '../../../shared/structured-data'

const PAGE_PATH = '/Information/AzureUpcomingRegions'

@Component({
  selector: 'app-azure-upcoming-regions',
  imports: [LucideIconComponent],
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
      canonicalUrl: absoluteUrl(PAGE_PATH),
      structuredData: buildBreadcrumbList([
        { name: 'Home', path: '/Azure/Latency' },
        { name: 'Azure regions', path: '/Information/AzureRegions' },
        { name: 'Upcoming regions', path: PAGE_PATH },
      ]),
    })
  }
}
