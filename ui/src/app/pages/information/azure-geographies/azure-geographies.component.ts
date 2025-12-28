import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import data from '../../../../assets/data/geographies.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildRegionDetailRouterLink } from '../../../shared/utils'

export interface Geography {
  name: string
  regions: Region[]
}

const GEOGRAPHIES = data as Geography[]

@Component({
  selector: 'app-azure-geographies',
  imports: [LucideIconComponent, RouterLink],
  templateUrl: './azure-geographies.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureGeographiesComponent implements OnInit {
  readonly tableData = signal<Geography[]>(GEOGRAPHIES)

  private readonly seoService = inject(SeoService)

  ngOnInit() {
    this.seoService.setMetaTitle('Azure Geographies | Data Residency and Compliance')
    this.seoService.setMetaDescription(
      'Learn about Azure Geographies, which are distinct markets designed to maintain data residency and compliance boundaries.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureGeographies')
  }

  protected readonly buildRegionRouterLink = buildRegionDetailRouterLink
}
