import { Component } from '@angular/core'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-azure-environments',
  templateUrl: './azure-environments.component.html'
})
export class AzureEnvironmentsComponent {
  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Environments')
    this.seoService.setMetaDescription('Difference between Azure cloud and sovereign clouds')
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureEnvironments')
  }
}
