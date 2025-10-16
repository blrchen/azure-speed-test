import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core'
import { CommonModule, isPlatformBrowser } from '@angular/common'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Subscription } from 'rxjs'
import { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet' // Corrected import for Map
import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import chinaRegionsJson from '../../../../assets/data/regions-china.json'
import govRegionsJson from '../../../../assets/data/regions-usgov.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'

@Component({
  selector: 'app-azure-region-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './azure-region-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureRegionDetailsComponent implements AfterViewInit, OnDestroy {
  regionData: Region | undefined
  regionId = 'EastUS'
  isLoading = false
  private subscription: Subscription
  private allRegions: Region[]
  private map!: LeafletMap
  private marker?: LeafletMarker
  private viewInitialized = false

  private route = inject(ActivatedRoute)
  private seoService = inject(SeoService)
  private platformId = inject(PLATFORM_ID)

  constructor() {
    // Merge all region data
    this.allRegions = [...azureGlobalCloudRegionsJson, ...chinaRegionsJson, ...govRegionsJson]

    this.subscription = this.route.paramMap.subscribe((params) => {
      const paramRegionId = params.get('regionId')
      this.regionId = paramRegionId ? paramRegionId : 'EastUS'
      this.loadRegionData()
      this.initializeSeoProperties()
    })
  }

  ngAfterViewInit() {
    this.viewInitialized = true
    if (isPlatformBrowser(this.platformId)) {
      void this.initMap()
    }
  }

  private loadRegionData(): void {
    this.isLoading = true
    this.regionData = this.allRegions.find(
      (region) => region.regionId.toLowerCase() === this.regionId.toLowerCase()
    )
    this.isLoading = false

    if (this.viewInitialized && isPlatformBrowser(this.platformId)) {
      void this.initMap()
    }
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle(`Azure Region - ${this.regionData?.displayName}`)
    this.seoService.setMetaDescription(this.regionDescription)
    this.seoService.setCanonicalUrl(
      `https://www.azurespeed.com/Information/AzureRegions/${this.regionId}`
    )
  }

  get regionIdLowercase(): string {
    return this.regionId.toLowerCase()
  }

  get regionDescription(): string {
    const region = this.regionData
    if (!region) {
      return 'Detailed information about this Azure region, including availability, location, and paired region guidance.'
    }

    const introParts: string[] = [`${region.displayName} is an Azure region`]
    if (region.geography) {
      let geographyPhrase = `serving ${region.geography}`
      if (region.geographicGroup && region.geographicGroup !== region.geography) {
        geographyPhrase += ` in ${region.geographicGroup}`
      }
      introParts.push(geographyPhrase)
    }
    if (region.datacenterLocation) {
      introParts.push(`from ${region.datacenterLocation}`)
    }
    const introSentence = `${introParts.join(' ')}.`

    const detailParts: string[] = []
    if (region.launchYear) {
      detailParts.push(`launched in ${region.launchYear}`)
    }
    if (typeof region.availabilityZoneCount === 'number') {
      if (region.availabilityZoneCount > 0) {
        const zoneLabel =
          region.availabilityZoneCount === 1
            ? '1 availability zone'
            : `${region.availabilityZoneCount} availability zones`
        detailParts.push(`offers ${zoneLabel}`)
      } else {
        detailParts.push('does not currently offer dedicated availability zones')
      }
    }
    if (region.pairedRegion) {
      detailParts.push(`is paired with ${region.pairedRegion}`)
    }
    if (region.availableTo) {
      detailParts.push(`available to ${region.availableTo}`)
    }
    const detailSentence = detailParts.length ? `${detailParts.join(', ')}.` : ''

    const residency = region.dataResidency
      ? region.dataResidency.trim().replace(/\.$/, '') + '.'
      : ''

    return [introSentence, detailSentence, residency].filter(Boolean).join(' ')
  }

  get availabilityZoneStatus(): string {
    const count = this.regionData?.availabilityZoneCount
    if (count === undefined || count === null) {
      return 'Not specified'
    }
    if (count > 0) {
      return `Supported (${count})`
    }
    return 'Not supported (0)'
  }

  private async initMap(): Promise<void> {
    if (!this.viewInitialized) return
    if (!isPlatformBrowser(this.platformId)) return
    if (!this.regionData?.latitude || !this.regionData?.longitude) return

    try {
      const mapElement = document.getElementById('region-map')
      if (!mapElement) {
        console.error('Map container not found')
        return
      }

      const leafletModule = await import('leaflet')
      const L = leafletModule.default ?? leafletModule

      if (!this.map) {
        this.map = L.map(mapElement).setView(
          [this.regionData.latitude, this.regionData.longitude],
          6
        )

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data (c) OpenStreetMap contributors'
        }).addTo(this.map)
      } else {
        this.map.setView([this.regionData.latitude, this.regionData.longitude], 6)
      }

      if (this.marker) {
        this.marker.remove()
      }

      this.marker = L.marker([this.regionData.latitude, this.regionData.longitude])
        .addTo(this.map)
        .bindPopup(this.regionData.displayName)

      this.marker.openPopup()

      requestAnimationFrame(() => {
        this.map.invalidateSize()
      })
    } catch (error) {
      console.error('Error in map initialization:', error)
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    if (isPlatformBrowser(this.platformId)) {
      if (this.marker) {
        this.marker.remove()
        this.marker = undefined
      }
      if (this.map) {
        this.map.remove()
      }
    }
  }
}
