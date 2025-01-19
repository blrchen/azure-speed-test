import { Component } from '@angular/core'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-azure-sovereign-clouds',
  templateUrl: './azure-sovereign-clouds.component.html'
})
export class AzureSovereignCloudsComponent {
  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Sovereign Clouds')
    this.seoService.setMetaDescription(
      'Azure Sovereign Clouds function on dedicated, physically and logically isolated networks within a country. Learn more about different Azure sovereign clouds including AzureCloud, AzureChinaCloud, and AzureUSGovernment.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureSovereignClouds')
  }
}
