import { Component, inject, OnInit } from '@angular/core'

import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-cdn',
  templateUrl: './cdn.component.html',
  imports: [LucideIconComponent],
  host: { class: 'block' },
})
export class CDNComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure CDN Speed Test',
      description:
        'Due to budget constraints, the CDN Speed Test feature is now disabled. Instead, consider using these alternative resources for testing latency and throughput.',
      canonicalUrl: 'https://www.azurespeed.com/Azure/CDN',
    })
  }
}
