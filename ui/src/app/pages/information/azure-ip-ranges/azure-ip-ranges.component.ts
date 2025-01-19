import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { SeoService } from '../../../services'

interface IpAddressPrefix {
  serviceTagId: string
  ipAddressPrefixes: string[]
}

@Component({
  selector: 'app-azure-ip-ranges',
  templateUrl: './azure-ip-ranges.component.html'
})
export class AzureIpRangesComponent implements OnInit {
  tableData: IpAddressPrefix | undefined
  serviceTagId = 'AzureCloud'
  isLoading = false

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService
  ) {
    this.route.paramMap.subscribe((params) => {
      const paramServiceTagId = params.get('serviceTagId')
      this.serviceTagId = paramServiceTagId ? paramServiceTagId : 'AzureCloud'
      this.initializeSeoProperties()
    })
  }

  ngOnInit() {
    this.isLoading = true
    this.tableData = this.route.snapshot.data['tableData']
    this.isLoading = false
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle(`Azure IP Ranges - ${this.serviceTagId}`)
    this.seoService.setMetaDescription(
      `IP ranges for Microsoft Azure Service Tag ${this.serviceTagId}.`
    )
    this.seoService.setCanonicalUrl(
      `https://www.azurespeed.com/Information/AzureIpRanges/${this.serviceTagId}`
    )
  }
}
