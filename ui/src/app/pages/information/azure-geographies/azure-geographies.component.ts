import { Component, OnInit } from '@angular/core'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import data from '../../../../assets/data/geographies.json'

export interface Geography {
  name: string
  regions: Region[]
}

@Component({
  selector: 'app-azure-geographies',
  templateUrl: './azure-geographies.component.html'
})
export class AzureGeographiesComponent implements OnInit {
  tableData: Geography[] = []

  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  ngOnInit() {
    this.tableData = data
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Geographies | Data Residency and Compliance')
    this.seoService.setMetaDescription(
      'Learn about Azure Geographies, which are distinct markets designed to maintain data residency and compliance boundaries.'
    )
    this.seoService.setMetaKeywords(
      'Azure, Geographies, Data Residency, Compliance, Azure Regions, Business Continuity, Disaster Recovery'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureGeographies')
  }
}
