import { Component, inject, OnInit } from '@angular/core'

import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { absoluteUrl, buildBreadcrumbList } from '../../../shared/structured-data'
import { buildRegionDetailHref } from '../../../shared/utils'

const PAGE_PATH = '/Information/AzureRestrictedRegions'

@Component({
  selector: 'app-azure-restricted-regions',
  imports: [LucideIconComponent],
  templateUrl: './azure-restricted-regions.component.html',
  host: { class: 'block' },
})
export class AzureRestrictedRegionsComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  readonly accessRestrictedRegions = azureGlobalCloudRegionsJson.filter(
    (region) => region.restricted
  )
  protected readonly buildRegionDetailHref = buildRegionDetailHref

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Restricted Access Azure Regions',
      description:
        'Azure regions requiring special onboarding, with geography, location, and availability details.',
      canonicalUrl: absoluteUrl(PAGE_PATH),
      structuredData: buildBreadcrumbList([
        { name: 'Home', path: '/Azure/Latency' },
        { name: 'Azure regions', path: '/Information/AzureRegions' },
        { name: 'Access restricted regions', path: PAGE_PATH },
      ]),
    })
  }
}
