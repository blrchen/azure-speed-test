import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import axios from 'axios'
import { environment } from '../../../environments/environment'

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
  templateUrl: './ipLookup.component.html'
})
export class IPLookupComponent implements OnInit {
  ipLookupForm: FormGroup
  isLoading = false
  result: IpAddress[] | null = null

  constructor(private formBuilder: FormBuilder) {
    this.ipLookupForm = this.formBuilder.group({
      ipOrDomain: ['', Validators.required]
    })
  }

  ngOnInit(): void {}

  async submitForm(): Promise<void> {
    if (this.ipLookupForm.invalid) {
      return
    }

    this.isLoading = true
    this.result = null

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
