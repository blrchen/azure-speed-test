import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { CommonModule, NgOptimizedImage } from '@angular/common'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-region-to-region-latency',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './region-to-region-latency.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegionToRegionLatencyComponent implements OnInit {
  private seoService = inject(SeoService)

  ngOnInit(): void {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Region to Region Latency')
    this.seoService.setMetaDescription(
      'View average latency between Azure datacenters on their backbone network and access additional resources for network latency statistics, testing VM network latency, and troubleshooting network performance.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/RegionToRegionLatency')
  }
}
