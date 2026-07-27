import { Component, inject, OnInit } from '@angular/core'

import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-azure-sovereign-clouds',
  imports: [LucideIconComponent],
  templateUrl: './azure-sovereign-clouds.component.html',
  host: { class: 'block' },
})
export class AzureSovereignCloudsComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure Sovereign Clouds',
      description:
        'Azure Sovereign Clouds function on dedicated, physically and logically isolated networks within a country. Learn more about different Azure sovereign clouds including AzureCloud, AzureChinaCloud, and AzureUSGovernment.',
      canonicalUrl: 'https://www.azurespeed.com/Information/AzureSovereignClouds',
    })
  }
}
