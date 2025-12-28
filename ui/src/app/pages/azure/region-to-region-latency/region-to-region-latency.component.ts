import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'

import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-region-to-region-latency',
  imports: [LucideIconComponent, NgOptimizedImage],
  templateUrl: './region-to-region-latency.component.html',
  styleUrl: './region-to-region-latency.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegionToRegionLatencyComponent implements OnInit {
  private seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setMetaTitle('Azure Region to Region Latency')
    this.seoService.setMetaDescription(
      'View average latency between Azure datacenters on their backbone network and access additional resources for network latency statistics, testing VM network latency, and troubleshooting network performance.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/RegionToRegionLatency')
  }
}
