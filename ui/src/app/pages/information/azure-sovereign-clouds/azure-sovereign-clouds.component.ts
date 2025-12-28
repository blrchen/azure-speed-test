import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-azure-sovereign-clouds',
  imports: [LucideIconComponent, RouterLink],
  templateUrl: './azure-sovereign-clouds.component.html',
  styleUrl: './azure-sovereign-clouds.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureSovereignCloudsComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setMetaTitle('Azure Sovereign Clouds')
    this.seoService.setMetaDescription(
      'Azure Sovereign Clouds function on dedicated, physically and logically isolated networks within a country. Learn more about different Azure sovereign clouds including AzureCloud, AzureChinaCloud, and AzureUSGovernment.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureSovereignClouds')
  }
}
