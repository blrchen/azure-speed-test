import { Component } from '@angular/core'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-region-to-region-latency',
  templateUrl: './region-to-region-latency.component.html'
})
export class RegionToRegionLatencyComponent {
  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Region to Region Latency')
    this.seoService.setMetaDescription(
      'View average latency between Azure datacenters on their backbone network and access additional resources for network latency statistics, testing VM network latency, and troubleshooting network performance.'
    )
    this.seoService.setMetaKeywords(
      'Azure, network latency, Azure datacenters, network performance, VM network latency, Azure regions, network statistics, Azure Network Latency Documentation'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/RegionToRegionLatency')
  }
}
