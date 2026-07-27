import { Component, inject, OnInit } from '@angular/core'

import govRegionsJson from '../../../../assets/data/regions-usgov.json'
import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { absoluteUrl, buildBreadcrumbList } from '../../../shared/structured-data'
import { buildRegionDetailHref } from '../../../shared/utils'

const PAGE_PATH = '/Information/AzureUSGovernmentRegions'

@Component({
  selector: 'app-azure-us-government-regions',
  imports: [LucideIconComponent],
  templateUrl: './azure-us-government-regions.component.html',
  host: { class: 'block' },
})
export class AzureUSGovernmentRegionsComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  readonly azureGovernmentRegions = govRegionsJson
  protected readonly buildRegionDetailHref = buildRegionDetailHref

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure US Government Cloud Regions',
      description:
        'Explore Azure US Government Cloud regions designed for US government entities and their partners, meeting various US government security and compliance requirements.',
      canonicalUrl: absoluteUrl(PAGE_PATH),
      structuredData: buildBreadcrumbList([
        { name: 'Home', path: '/Azure/Latency' },
        { name: 'Azure regions', path: '/Information/AzureRegions' },
        { name: 'Azure US government cloud regions', path: PAGE_PATH },
      ]),
    })
  }
}
