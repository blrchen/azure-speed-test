import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import data from '../../../../assets/data/geographies.json'

export interface Geography {
  name: string
  regions: Region[]
}

@Component({
  selector: 'app-azure-geographies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './azure-geographies.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureGeographiesComponent implements OnInit {
  readonly tableData = signal<Geography[]>([])

  private seoService = inject(SeoService)

  ngOnInit() {
    this.initializeSeoProperties()
    this.tableData.set(data as Geography[])
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Geographies | Data Residency and Compliance')
    this.seoService.setMetaDescription(
      'Learn about Azure Geographies, which are distinct markets designed to maintain data residency and compliance boundaries.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureGeographies')
  }
}
