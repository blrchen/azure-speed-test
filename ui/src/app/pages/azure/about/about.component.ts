import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { SeoService } from '../../../services'
import { HeroIconComponent } from '../../../shared/icons/hero-icons.imports'

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, HeroIconComponent],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {
  private seoService = inject(SeoService)

  ngOnInit(): void {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('About AzureSpeed')
    this.seoService.setMetaDescription(
      'AzureSpeed is a speed test tool that measures your network latency, download, and upload speeds across multiple global locations. It helps you to choose the best Azure region for your applications.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/About')
  }
}
