import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { SeoService } from '../../services'

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setMetaTitle('Privacy Policy - Azure Speed Test')
    this.seoService.setMetaDescription(
      'Understand how Azure Speed Test handles analytics data and protects your information during latency measurements.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeedtest.com/Privacy')
  }
}
