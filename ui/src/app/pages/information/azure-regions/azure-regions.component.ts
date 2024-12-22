import { Component, OnInit } from '@angular/core'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import data from '../../../../assets/data/regions.json'

@Component({
  selector: 'app-azure-regions',
  templateUrl: './azure-regions.component.html'
})
export class AzureRegionsComponent implements OnInit {
  azurePublicRegions: Region[] = []
  azureChinaRegions: Region[] = []
  accessRestrictedRegions: Region[] = []
  sortColumn = 'displayName'
  sortDirection: 'asc' | 'desc' = 'asc'

  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Regions and Data Centers')
    this.seoService.setMetaDescription(
      'Explore the available and access restricted Azure regions, including their geography, physical location, availability zones, and paired regions for disaster recovery.'
    )
    this.seoService.setMetaKeywords(
      'Azure regions, Azure datacenters, Azure availability zones, Azure region pairs, disaster recovery, Azure cross-region replication, Azure resiliency, Azure BCDR'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureRegions')
  }

  ngOnInit() {
    this.azurePublicRegions = data
      .filter((region) => !region.restricted && region.geographyGroup !== 'China')
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
    this.azureChinaRegions = data
      .filter((region) => !region.restricted && region.geographyGroup === 'China')
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
    this.accessRestrictedRegions = data
      .filter((region) => region.restricted)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  sortData(table: 'public' | 'restricted' | 'china', column: keyof Region) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortDirection = 'asc' // reset to ascending for new column
    }

    this.sortColumn = column // set sort column to provided column

    const direction = this.sortDirection === 'asc' ? 1 : -1

    let dataArray: Region[] = []

    if (table === 'public') {
      dataArray = this.azurePublicRegions
    } else if (table === 'restricted') {
      dataArray = this.accessRestrictedRegions
    } else if (table === 'china') {
      dataArray = this.azureChinaRegions
    }

    dataArray.sort((a, b) => {
      const aValue = a[column] ?? ''
      const bValue = b[column] ?? ''
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * direction
      }
      return (Number(aValue) - Number(bValue)) * direction // Handles numerical values appropriately
    })
  }
}
