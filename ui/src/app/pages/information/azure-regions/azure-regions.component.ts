import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import publicRegionsJson from '../../../../assets/data/regions.json'
import chinaRegionsJson from '../../../../assets/data/regions-china.json'
import govRegionsJson from '../../../../assets/data/regions-gov.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-azure-regions',
  templateUrl: './azure-regions.component.html'
})
export class AzureRegionsComponent implements OnInit {
  azurePublicRegions: Region[] = []
  azureChinaRegions: Region[] = []
  accessRestrictedRegions: Region[] = []
  azureGovernmentRegions: Region[] = []
  sortColumn = 'displayName'
  sortDirection: 'asc' | 'desc' = 'asc'

  constructor(
    private seoService: SeoService,
    private router: Router
  ) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Regions and Data Centers')
    this.seoService.setMetaDescription(
      'Explore the available and access restricted Azure regions, including their geography, physical location, availability zones, and paired regions for disaster recovery.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureRegions')
  }

  ngOnInit() {
    this.azurePublicRegions = publicRegionsJson
      .filter((region) => !region.restricted)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
    this.azureChinaRegions = chinaRegionsJson.sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    )
    this.accessRestrictedRegions = publicRegionsJson
      .filter((region) => region.restricted)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
    this.azureGovernmentRegions = govRegionsJson.sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    )
  }

  sortData(table: 'public' | 'restricted' | 'china' | 'government', column: keyof Region) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortDirection = 'asc'
    }
    this.sortColumn = column

    let dataToSort: Region[] = []
    if (table === 'public') {
      dataToSort = this.azurePublicRegions
    } else if (table === 'restricted') {
      dataToSort = this.accessRestrictedRegions
    } else if (table === 'government') {
      dataToSort = this.azureGovernmentRegions
    } else {
      dataToSort = this.azureChinaRegions
    }

    dataToSort.sort((a, b) => {
      const valA = (a[column] || '').toString().toLowerCase()
      const valB = (b[column] || '').toString().toLowerCase()
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  getRegionUrl(displayName: string): string {
    return '/Information/AzureRegions/' + displayName.replace(/\s+/g, '')
  }
}
