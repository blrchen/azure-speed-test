import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import chinaRegionsJson from '../../../../assets/data/regions-china.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { HeroIconComponent } from '../../../shared/icons/hero-icons.imports'

@Component({
  selector: 'app-azure-china-regions',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroIconComponent],
  templateUrl: './azure-china-regions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureChinaRegionsComponent implements OnInit {
  readonly azureChinaRegions = signal<Region[]>([])

  private seoService = inject(SeoService)

  ngOnInit() {
    this.initializeSeoProperties()
    this.azureChinaRegions.set(chinaRegionsJson as Region[])
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure China Cloud Regions')
    this.seoService.setMetaDescription(
      'Explore Azure China Cloud regions operated by 21Vianet, including their geography, datacenter location, availability zones, and paired regions.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureChinaRegions')
  }
}
