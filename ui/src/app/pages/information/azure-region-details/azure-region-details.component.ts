import { Component, OnInit, PLATFORM_ID, Inject, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'
import { ActivatedRoute } from '@angular/router'
import publicRegionsJson from '../../../../assets/data/regions.json'
import chinaRegionsJson from '../../../../assets/data/regions-china.json'
import govRegionsJson from '../../../../assets/data/regions-gov.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { isPlatformBrowser } from '@angular/common'
import { Map as LeafletMap } from 'leaflet' // Corrected import for Map

@Component({
  selector: 'app-azure-region-details',
  templateUrl: './azure-region-details.component.html'
})
export class AzureRegionDetailsComponent implements OnInit, OnDestroy {
  regionData: Region | undefined
  regionId = 'EastUS'
  isLoading = false
  private subscription: Subscription
  private allRegions: Region[]
  private map!: LeafletMap

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Merge all region data
    this.allRegions = [...publicRegionsJson, ...chinaRegionsJson, ...govRegionsJson]

    this.subscription = this.route.paramMap.subscribe((params) => {
      const paramRegionId = params.get('regionId')
      this.regionId = paramRegionId ? paramRegionId : 'EastUS'
      this.loadRegionData()
      this.initializeSeoProperties()
    })
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.initMap()
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }
  }

  private loadRegionData(): void {
    this.isLoading = true
    this.regionData = this.allRegions.find(
      (region) => region.name.toLowerCase() === this.regionId.toLowerCase()
    )
    this.isLoading = false
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle(`Azure Region - ${this.regionData?.displayName}`)
    this.seoService.setMetaDescription(
      `Explore details about Azure region ${this.regionData?.displayName}, including availability, IP ranges, and geographical location.`
    )
    this.seoService.setCanonicalUrl(
      `https://www.azurespeed.com/Information/AzureRegions/${this.regionId}`
    )
  }

  private async initMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return
    if (!this.regionData?.latitude || !this.regionData?.longitude) return

    try {
      if (this.map) {
        this.map.remove()
      }

      const leafletModule = await import('leaflet')
      const L = leafletModule.default ?? leafletModule

      // Ensure the map container exists
      const mapElement = document.getElementById('region-map')
      if (!mapElement) {
        console.error('Map container not found')
        return
      }

      this.map = L.map('region-map').setView(
        [this.regionData.latitude, this.regionData.longitude],
        6
      )

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map)

      L.marker([this.regionData.latitude, this.regionData.longitude])
        .addTo(this.map)
        .bindPopup(this.regionData.displayName)
        .openPopup()
    } catch (error) {
      console.error('Error in map initialization:', error)
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    if (isPlatformBrowser(this.platformId) && this.map) {
      this.map.remove()
    }
  }
}
