import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-azure-environments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './azure-environments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureEnvironmentsComponent implements OnInit {
  private seoService = inject(SeoService)

  ngOnInit(): void {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Environments')
    this.seoService.setMetaDescription('Difference between Azure cloud and sovereign clouds')
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureEnvironments')
  }
}
