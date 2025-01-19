import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import axios from 'axios'
import { environment } from '../../../../environments/environment'
import { SeoService } from '../../../services'

interface IpAddress {
  serviceTagId: string
  ipAddress: string
  ipAddressPrefix: string
  region: string
  systemService: string
  networkFeatures: string
}

@Component({
  selector: 'app-ip-lookup',
  templateUrl: './ip-lookup.component.html',
  styleUrl: './ip-lookup.component.css'
})
export class IPLookupComponent {
  ipLookupForm: FormGroup
  isLoading = false
  currentSearchTerm = ''
  result: IpAddress[] | null = null

  constructor(
    private formBuilder: FormBuilder,
    private seoService: SeoService
  ) {
    this.ipLookupForm = this.formBuilder.group({
      ipOrDomain: ['', Validators.required]
    })
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure IP Lookup')
    this.seoService.setMetaDescription(
      'Search for service tag and region information using an IP address or domain name.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/IPLookup')
  }

  async submitForm(): Promise<void> {
    if (this.ipLookupForm.invalid) {
      return
    }

    this.result = null
    this.isLoading = true
    this.currentSearchTerm = this.ipLookupForm.get('ipOrDomain')!.value

    const ipOrDomain = this.ipLookupForm.get('ipOrDomain')?.value
    const url = `${environment.apiEndpoint}/api/ipAddress?ipOrDomain=${encodeURIComponent(
      ipOrDomain
    )}`

    try {
      const response = await axios.get<IpAddress[]>(url)
      this.result = response.data
    } catch (error) {
      console.error('Error:', error)
    } finally {
      this.isLoading = false
    }
  }
}
