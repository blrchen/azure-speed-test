import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-azure-sovereign-clouds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './azure-sovereign-clouds.component.html',
  styleUrls: ['./azure-sovereign-clouds.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureSovereignCloudsComponent implements OnInit {
  private seoService = inject(SeoService)

  ngOnInit(): void {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Sovereign Clouds')
    this.seoService.setMetaDescription(
      'Azure Sovereign Clouds function on dedicated, physically and logically isolated networks within a country. Learn more about different Azure sovereign clouds including AzureCloud, AzureChinaCloud, and AzureUSGovernment.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureSovereignClouds')
  }
}
