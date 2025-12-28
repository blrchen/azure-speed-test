import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import chinaRegionsJson from '../../../../assets/data/regions-china.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildRegionDetailRouterLink } from '../../../shared/utils'

@Component({
  selector: 'app-azure-china-regions',
  imports: [RouterLink, LucideIconComponent],
  templateUrl: './azure-china-regions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureChinaRegionsComponent implements OnInit {
  readonly azureChinaRegions = signal<Region[]>([])

  private seoService = inject(SeoService)

  ngOnInit() {
    this.seoService.setMetaTitle('Azure China Cloud Regions')
    this.seoService.setMetaDescription(
      'Explore Azure China Cloud regions operated by 21Vianet, including their geography, datacenter location, availability zones, and paired regions.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureChinaRegions')
    this.azureChinaRegions.set(chinaRegionsJson as Region[])
  }

  protected readonly buildRegionRouterLink = buildRegionDetailRouterLink
}
