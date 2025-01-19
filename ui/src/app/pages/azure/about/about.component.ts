import { Component } from '@angular/core'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html'
})
export class AboutComponent {
  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('About AzureSpeed')
    this.seoService.setMetaDescription(
      'AzureSpeed is a speed test tool that measures your network latency, download, and upload speeds across multiple global locations. It helps you to choose the best Azure region for your applications.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/About')
  }
}
