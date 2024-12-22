import { Component } from '@angular/core'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-psping',
  templateUrl: './psPing.component.html'
})
export class PSPingComponent {
  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('PsPing Network Latency Test')
    this.seoService.setMetaDescription(
      'Learn how to use PsPing from the PsTools suite to measure network latency to Azure datacenters accurately. This guide provides step-by-step instructions and useful tips.'
    )
    this.seoService.setMetaKeywords(
      'PsPing, network latency, Azure datacenters, PsTools, network performance, TCP ping, ICMP ping, latency measurement, bandwidth measurement, Azure speed test'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/PsPing')
  }
}
