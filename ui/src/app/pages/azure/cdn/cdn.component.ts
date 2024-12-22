import { Component } from '@angular/core'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-cdn',
  templateUrl: './cdn.component.html'
})
export class CDNComponent {
  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure CDN Speed Test')
    this.seoService.setMetaDescription(
      'Due to budget constraints, the CDN Speed Test feature is now disabled. Instead, consider using these alternative resources for testing latency and throughput.'
    )
    this.seoService.setMetaKeywords(
      'Azure, CDN, CDN Speed Test, CDN Performance, Latency, Throughput'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/CDN')
  }
}
