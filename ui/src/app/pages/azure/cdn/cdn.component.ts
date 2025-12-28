import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'

import { SeoService } from '../../../services'

@Component({
  selector: 'app-cdn',
  templateUrl: './cdn.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CDNComponent implements OnInit {
  private seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setMetaTitle('Azure CDN Speed Test')
    this.seoService.setMetaDescription(
      'Due to budget constraints, the CDN Speed Test feature is now disabled. Instead, consider using these alternative resources for testing latency and throughput.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/CDN')
  }
}
