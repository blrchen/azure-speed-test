import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-azure-ip-ranges-by-service',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './azure-ip-ranges-by-service.component.html',
  styleUrl: './azure-ip-ranges-by-service.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureIpRangesByServiceComponent implements OnInit {
  private seoService = inject(SeoService)

  ngOnInit(): void {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Explore Azure IP Ranges By Service')
    this.seoService.setMetaDescription(
      'Discover Azure IP ranges for various services globally. This comprehensive list includes IP ranges for Azure services across different regions and countries.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureIpRangesByService')
  }
}
