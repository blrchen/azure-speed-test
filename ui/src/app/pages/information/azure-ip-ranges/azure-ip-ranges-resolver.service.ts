import { Injectable } from '@angular/core'
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import axios from 'axios'

interface IpAddressPrefix {
  serviceTagId: string
  ipAddressPrefixes: string[]
}

@Injectable({ providedIn: 'root' })
export class AzureIpRangesResolver implements Resolve<IpAddressPrefix | undefined> {
  async resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
    const serviceTagId = route.paramMap.get('serviceTagId') || 'AzureCloud'
    try {
      const response = await axios.get(
        `https://www.azurespeed.com/api/serviceTags/${serviceTagId}/ipAddressPrefixes`
      )
      return response.data
    } catch (error) {
      console.error('Error in resolver fetching data:', error)
      return undefined
    }
  }
}
