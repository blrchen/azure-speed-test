import { Component, inject, OnInit } from '@angular/core'

import { SeoService } from '../../../services/seo.service'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-azure-environments',
  imports: [LucideIconComponent],
  templateUrl: './azure-environments.component.html',
  host: { class: 'block' },
})
export class AzureEnvironmentsComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure Environments',
      description: 'Difference between Azure cloud and sovereign clouds',
      canonicalUrl: 'https://www.azurespeed.com/Information/AzureEnvironments',
    })
  }
}
