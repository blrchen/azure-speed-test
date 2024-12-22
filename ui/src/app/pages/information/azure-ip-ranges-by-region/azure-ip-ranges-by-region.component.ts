import { Component } from '@angular/core'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-azure-ip-ranges-by-region',
  templateUrl: './azure-ip-ranges-by-region.component.html'
})
export class AzureIpRangesByRegionComponent {
  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Explore Azure IP Ranges by Region')
    this.seoService.setMetaDescription(
      'Discover the comprehensive list of Azure IP ranges by region to optimize your application�s network performance. Understand regional IP ranges for better resource allocation and enhanced security measures.'
    )
    this.seoService.setMetaKeywords(
      'Azure IP Ranges, Azure Services Tags, Azure Region IP Addresses, Network Optimization, Azure Network Performance, Azure Infrastructure, Cloud IP Ranges, Azure Security, Data Center Locations, Azure Networking'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureIpRangesByRegion')
  }
}
