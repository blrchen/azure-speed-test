import { Component, inject, OnInit } from '@angular/core'

import { SeoService } from '../../services/seo.service'
import { LucideIconComponent } from '../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-privacy',
  imports: [LucideIconComponent],
  templateUrl: './privacy.component.html',
  host: { class: 'block' },
})
export class PrivacyComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Privacy Policy - Azure Speed Test',
      description:
        'Understand how Azure Speed Test handles analytics data and protects your information during latency measurements.',
      canonicalUrl: 'https://www.azurespeed.com/Privacy',
    })
  }
}
