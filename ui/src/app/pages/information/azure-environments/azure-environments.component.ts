import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'

import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-azure-environments',
  imports: [LucideIconComponent],
  templateUrl: './azure-environments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureEnvironmentsComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setMetaTitle('Azure Environments')
    this.seoService.setMetaDescription('Difference between Azure cloud and sovereign clouds')
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureEnvironments')
  }
}
