import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import axios from 'axios'
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

  async ngOnInit() {
    this.isLoading = true
    try {
      const response = await axios.get(
        `https://www.azurespeed.com/api/serviceTags/${this.serviceTagId}/ipAddressPrefixes`
      )
      this.tableData = response.data
      this.isLoading = false
    } catch (error) {
      console.error('Error fetching data:', error)
      this.isLoading = false
    }
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle(`Azure IP Ranges - ${this.serviceTagId}`)
    this.seoService.setMetaDescription(
      'Explore and discover comprehensive lists of IP ranges used by Microsoft Azure services across different regions.'
    )
    this.seoService.setMetaKeywords(
      'Microsoft Azure, Azure IP Ranges, Azure Service Tags, Azure Cloud IPs, Azure Services IP Ranges'
    )
    this.seoService.setCanonicalUrl(
      `https://www.azurespeed.com/Information/AzureIpRanges/${this.serviceTagId}`
    )
  }
}
