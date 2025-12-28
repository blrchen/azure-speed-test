import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-psping',
  imports: [LucideIconComponent, NgOptimizedImage, RouterLink],
  templateUrl: './psPing.component.html',
  styleUrl: './psPing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PSPingComponent implements OnInit {
  private seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setMetaTitle('PsPing Network Latency Test')
    this.seoService.setMetaDescription(
      'Learn how to use PsPing from the PsTools suite to measure network latency to Azure datacenters accurately. This guide provides step-by-step instructions and useful tips.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/PsPing')
  }
}
