import { Component } from '@angular/core'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-azure-ip-ranges-by-service',
  templateUrl: './azure-ip-ranges-by-service.component.html'
})
export class AzureIpRangesByServiceComponent {
  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Explore Azure IP Ranges By Service')
    this.seoService.setMetaDescription(
      'Discover Azure IP ranges for various services globally. This comprehensive list includes IP ranges for Azure services across different regions and countries.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureIpRangesByService')
  }
}
