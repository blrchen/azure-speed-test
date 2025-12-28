import { isPlatformBrowser } from '@angular/common'
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EffectRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ViewEncapsulation
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'
import { map } from 'rxjs'

import chinaRegionsJson from '../../../../assets/data/regions-china.json'
import govRegionsJson from '../../../../assets/data/regions-usgov.json'
import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildRegionDetailRouterLink, toRegionNameNoSpace } from '../../../shared/utils'

@Component({
  selector: 'app-azure-region-details',
  imports: [RouterLink, LucideIconComponent],
  templateUrl: './azure-region-details.component.html',
  styleUrl: './azure-region-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block' }
})
export class AzureRegionDetailsComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly seoService = inject(SeoService)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly isBrowser = isPlatformBrowser(this.platformId)

  private readonly viewInitialized = signal(false)

  private readonly allRegions: Region[] = [
    ...(azureGlobalCloudRegionsJson as Region[]),
    ...(chinaRegionsJson as Region[]),
    ...(govRegionsJson as Region[])
  ]

  private readonly requestedRegionId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('regionId')?.trim() || 'EastUS')),
    { initialValue: 'EastUS' }
  )

  readonly regionId = computed(() => this.requestedRegionId())
  readonly regionIdLowercase = computed(() => this.regionId().toLowerCase())
  readonly regionData = computed<Region | null>(() => {
    const requestedId = this.regionIdLowercase()
    return this.allRegions.find((region) => region.regionId.toLowerCase() === requestedId) ?? null
  })
  readonly breadcrumbLabel = computed(() => this.regionData()?.displayName ?? this.regionId())
  readonly availabilityZoneStatus = computed(() =>
    this.computeAvailabilityZoneStatus(this.regionData())
  )
  readonly regionDescription = computed(() => this.buildRegionDescription(this.regionData()))
  readonly hasCoordinates = computed(() => {
    const region = this.regionData()
    return !!region?.latitude && !!region?.longitude
  })
  readonly regionCoordinatesHref = computed(() => {
    const region = this.regionData()
    if (!region?.latitude || !region?.longitude) {
      return ''
    }
    return `https://www.google.com/maps/search/${region.latitude},${region.longitude}`
  })
  readonly mapLoaded = signal(false)
  readonly relatedRegions = computed(() => {
    const current = this.regionData()
    if (!current) return []
    return this.allRegions
      .filter(
        (r) =>
          r.regionId !== current.regionId &&
          (r.geography === current.geography ||
            r.pairedRegion === current.displayName ||
            current.pairedRegion === r.displayName)
      )
      .slice(0, 6)
  })

  private map: LeafletMap | null = null
  private marker: LeafletMarker | null = null
  private navigatedToNotFound = false

  private readonly notFoundEffect: EffectRef = effect(() => {
    const region = this.regionData()
    const regionId = this.regionId()
    if (!region && regionId && !this.navigatedToNotFound) {
      this.navigatedToNotFound = true
      void this.router.navigate(['/Information'], { replaceUrl: true })
    }
  })

  private readonly seoEffect: EffectRef = effect(() => {
    const region = this.regionData()
    if (!region) {
      return
    }

    this.seoService.setMetaTitle(`Azure Region - ${region.displayName}`)
    this.seoService.setMetaDescription(this.regionDescription())
    this.seoService.setCanonicalUrl(
      `https://www.azurespeed.com/Information/AzureRegions/${toRegionNameNoSpace(
        region.displayName
      )}`
    )
  })

  private readonly mapEffect: EffectRef = effect(
    () => {
      if (!this.viewInitialized() || !this.isBrowser) {
        return
      }
      const region = this.regionData()
      void this.renderMap(region)
    },
    { allowSignalWrites: true }
  )

  ngAfterViewInit(): void {
    this.viewInitialized.set(true)
    if (this.isBrowser) {
      void this.renderMap(this.regionData())
    }
  }

  readonly buildRegionRouterLink = buildRegionDetailRouterLink

  ngOnDestroy(): void {
    this.mapEffect.destroy()
    this.seoEffect.destroy()
    this.notFoundEffect.destroy()
    this.teardownMap()
  }

  private computeAvailabilityZoneStatus(region: Region | null): string {
    const count = region?.availabilityZoneCount
    if (count === undefined || count === null) {
      return 'Not specified'
    }
    if (count > 0) {
      return `Supported (${count})`
    }
    return 'Not supported (0)'
  }

  private buildRegionDescription(region: Region | null): string {
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

  private async renderMap(region: Region | null): Promise<void> {
    if (!this.isBrowser) {
      return
    }
    if (!this.viewInitialized()) {
      return
    }
    if (!region?.latitude || !region?.longitude) {
      this.teardownMap()
      return
    }

    this.mapLoaded.set(false)

    try {
      const mapElement = document.getElementById('region-map')
      if (!mapElement) {
        return
      }

      const leafletModule = await import('leaflet')
      const L = leafletModule.default ?? leafletModule

      if (!this.map) {
        this.map = L.map(mapElement).setView([region.latitude, region.longitude], 6)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data (c) OpenStreetMap contributors'
        }).addTo(this.map)
      } else {
        this.map.setView([region.latitude, region.longitude], 6)
      }

      if (this.marker) {
        this.marker.remove()
      }

      this.marker = L.marker([region.latitude, region.longitude])
        .addTo(this.map)
        .bindPopup(region.displayName)

      this.marker.openPopup()

      requestAnimationFrame(() => {
        this.map?.invalidateSize()
        this.mapLoaded.set(true)
      })
    } catch {
      this.mapLoaded.set(true)
    }
  }

  private teardownMap(): void {
    if (this.marker) {
      this.marker.remove()
      this.marker = null
    }
    if (this.map) {
      this.map.remove()
      this.map = null
    }
  }
}
