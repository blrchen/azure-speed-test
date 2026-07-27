import { Component, inject, OnInit } from '@angular/core'

import chinaRegionsJson from '../../../../assets/data/regions-china.json'
import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { absoluteUrl, buildBreadcrumbList } from '../../../shared/structured-data'
import { buildRegionDetailHref } from '../../../shared/utils'

const PAGE_PATH = '/Information/AzureChinaRegions'

@Component({
  selector: 'app-azure-china-regions',
  imports: [LucideIconComponent],
  templateUrl: './azure-china-regions.component.html',
  host: { class: 'block' },
})
export class AzureChinaRegionsComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  readonly azureChinaRegions = chinaRegionsJson
  protected readonly buildRegionDetailHref = buildRegionDetailHref

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure China Cloud Regions',
      description:
        'Explore Azure China Cloud regions operated by 21Vianet, including their geography, datacenter location, availability zones, and paired regions.',
      canonicalUrl: absoluteUrl(PAGE_PATH),
      structuredData: buildBreadcrumbList([
        { name: 'Home', path: '/Azure/Latency' },
        { name: 'Azure regions', path: '/Information/AzureRegions' },
        { name: 'Azure China cloud regions', path: PAGE_PATH },
      ]),
    })
  }
}
