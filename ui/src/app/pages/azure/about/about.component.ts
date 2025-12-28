import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'

import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-about',
  imports: [LucideIconComponent],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {
  private seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setMetaTitle('About Azure Speed Test')
    this.seoService.setMetaDescription(
      'AzureSpeed is a speed test tool that measures your network latency, download, and upload speeds across multiple global locations. It helps you to choose the best Azure region for your applications.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/About')
  }
}
