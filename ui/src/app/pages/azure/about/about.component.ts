import { Component, inject, OnInit } from '@angular/core'

import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-about',
  imports: [LucideIconComponent],
  templateUrl: './about.component.html',
  host: { class: 'block' },
})
export class AboutComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'About Azure Speed Test',
      description:
        'AzureSpeed is a speed test tool that measures your network latency, download, and upload speeds across multiple global locations. It helps you to choose the best Azure region for your applications.',
      canonicalUrl: 'https://www.azurespeed.com/Azure/About',
    })
  }
}
