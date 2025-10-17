import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { CommonModule, NgOptimizedImage } from '@angular/common'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-psping',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './psPing.component.html',
  styleUrls: ['./psPing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PSPingComponent implements OnInit {
  private seoService = inject(SeoService)

  ngOnInit(): void {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('PsPing Network Latency Test')
    this.seoService.setMetaDescription(
      'Learn how to use PsPing from the PsTools suite to measure network latency to Azure datacenters accurately. This guide provides step-by-step instructions and useful tips.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/PsPing')
  }
}
