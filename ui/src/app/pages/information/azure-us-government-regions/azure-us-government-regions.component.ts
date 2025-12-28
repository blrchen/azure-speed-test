import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import govRegionsJson from '../../../../assets/data/regions-usgov.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildRegionDetailRouterLink } from '../../../shared/utils'

@Component({
  selector: 'app-azure-us-government-regions',
  imports: [RouterLink, LucideIconComponent],
  templateUrl: './azure-us-government-regions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureUSGovernmentRegionsComponent implements OnInit {
  readonly azureGovernmentRegions = signal<Region[]>([])

  private seoService = inject(SeoService)

  ngOnInit() {
    this.seoService.setMetaTitle('Azure US Government Cloud Regions')
    this.seoService.setMetaDescription(
      'Explore Azure US Government Cloud regions designed for US government entities and their partners, meeting various US government security and compliance requirements.'
    )
    this.seoService.setCanonicalUrl(
      'https://www.azurespeed.com/Information/AzureUSGovernmentRegions'
    )
    this.azureGovernmentRegions.set(govRegionsJson as Region[])
  }

  protected readonly buildRegionRouterLink = buildRegionDetailRouterLink
}
