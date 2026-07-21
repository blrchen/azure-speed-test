import { Component, computed, effect, inject, input } from '@angular/core'
import { Router, RouterLink } from '@angular/router'

import chinaRegionsJson from '../../../../assets/data/regions-china.json'
import govRegionsJson from '../../../../assets/data/regions-usgov.json'
import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services/seo.service'
import { buildAzureCloudRegionServiceTagHref } from '../../../services/service-tags-snapshot'
import { buildVmRegionHref } from '../../../services/vm-catalog'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { AzureRegionMapViewComponent } from '../../../shared/region-map/azure-region-map-view.component'
import { buildRegionDetailHref, toRegionNameNoSpace } from '../../../shared/utils'

type RegionBreadcrumbSource = 'restricted' | 'china' | 'usgov'

const REGION_BREADCRUMB_MAP: Record<RegionBreadcrumbSource, { label: string; routerLink: string }> =
  {
    restricted: {
      label: 'Access restricted regions',
      routerLink: '/Information/AzureRestrictedRegions',
    },
    china: {
      label: 'Azure China cloud regions',
      routerLink: '/Information/AzureChinaRegions',
    },
    usgov: {
      label: 'Azure US government cloud regions',
      routerLink: '/Information/AzureUSGovernmentRegions',
    },
  }

function isRegionBreadcrumbSource(value: string): value is RegionBreadcrumbSource {
  return value in REGION_BREADCRUMB_MAP
}

function normalizeRegionIdInput(value: string | undefined): string {
  const normalized = value?.trim()
  if (normalized === '') return 'EastUS'
  return normalized ?? 'EastUS'
}

function normalizeBreadcrumbSourceInput(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

@Component({
  selector: 'app-azure-region-details',
  imports: [RouterLink, LucideIconComponent, AzureRegionMapViewComponent],
  templateUrl: './azure-region-details.component.html',
  styleUrl: './azure-region-details.component.css',
  host: { class: 'block' },
})
export class AzureRegionDetailsComponent {
  private readonly router = inject(Router)
  private readonly seoService = inject(SeoService)

  private readonly allRegions: Region[] = [
    ...(azureGlobalCloudRegionsJson as Region[]),
    ...(chinaRegionsJson as Region[]),
    ...(govRegionsJson as Region[]),
  ]
  private readonly globalRegionIds = new Set(
    (azureGlobalCloudRegionsJson as Region[]).map((region) => region.regionId.toLowerCase())
  )

  readonly regionId = input('EastUS', { transform: normalizeRegionIdInput })
  readonly source = input('', { transform: normalizeBreadcrumbSourceInput })

  readonly regionData = computed(() => {
    const requestedId = this.regionId().toLowerCase()
    return this.allRegions.find((region) => region.regionId.toLowerCase() === requestedId) ?? null
  })
  readonly breadcrumbParent = computed(() => {
    const source = this.source()
    if (!source) return null
    return isRegionBreadcrumbSource(source) ? REGION_BREADCRUMB_MAP[source] : null
  })
  readonly breadcrumbQueryParams = computed(() => {
    const source = this.source()
    return source ? { source } : undefined
  })
  readonly regionServiceTagHref = computed(() =>
    buildAzureCloudRegionServiceTagHref(this.regionData()?.regionId ?? this.regionId())
  )
  readonly vmRegionCatalogHref = computed(() => {
    const regionId = this.regionData()?.regionId.toLowerCase() ?? ''
    return regionId && this.globalRegionIds.has(regionId) ? buildVmRegionHref(regionId) : ''
  })
  readonly regionDescription = computed(() => this.buildRegionDescription(this.regionData()))
  readonly regionMetaDescription = computed(() =>
    this.buildRegionMetaDescription(this.regionData())
  )
  readonly hasCoordinates = computed(() => {
    const region = this.regionData()
    return region !== null && Number.isFinite(region.latitude) && Number.isFinite(region.longitude)
  })
  readonly regionReferencePointHref = computed(() => {
    const region = this.regionData()
    if (!region || !Number.isFinite(region.latitude) || !Number.isFinite(region.longitude))
      return ''
    return `https://www.google.com/maps/search/${region.latitude.toFixed(1)},${region.longitude.toFixed(1)}`
  })
  readonly regionMapRegions = computed<readonly Region[]>(() => {
    const region = this.regionData()
    return region && this.hasCoordinates() ? [region] : []
  })
  readonly regionMapAriaLabel = computed(() => {
    const region = this.regionData()
    if (!region) return 'Context map showing an approximate Azure region-level location'

    const location = this.buildRegionLocationParts(region).join(', ')
    return `Context map showing the approximate region-level location of ${region.displayName}${location ? ` in ${location}` : ''}`
  })
  readonly availabilityZoneSummary = computed(() => {
    const count = this.regionData()?.availabilityZoneCount
    if (!count) return 'No AZ support'
    return count === 1 ? '1 availability zone' : `${count} availability zones`
  })
  readonly pairedRegionData = computed(() => {
    const current = this.regionData()
    const pairedRegion = current?.pairedRegion.trim()
    if (!pairedRegion) return null

    return (
      this.allRegions.find(
        (region) => region.displayName.toLowerCase() === pairedRegion.toLowerCase()
      ) ?? null
    )
  })
  readonly otherRelatedRegions = computed(() => {
    const current = this.regionData()
    if (!current) return []

    return this.allRegions
      .filter(
        (region) =>
          region.regionId !== current.regionId &&
          region.geography === current.geography &&
          region.displayName !== current.pairedRegion
      )
      .slice(0, 5)
  })
  readonly hasRelatedRegions = computed(
    () => this.pairedRegionData() !== null || this.otherRelatedRegions().length > 0
  )

  private navigatedToNotFound = false

  constructor() {
    effect(() => {
      if (!this.regionData() && this.regionId() && !this.navigatedToNotFound) {
        this.navigatedToNotFound = true
        void this.router.navigate(['/not-found'], { replaceUrl: true })
      }
    })

    effect(() => {
      const region = this.regionData()
      if (!region) return

      this.seoService.setPageMeta({
        title: `${region.displayName} Azure Region`,
        description: this.regionMetaDescription(),
        canonicalUrl: `https://www.azurespeed.com/Information/AzureRegions/${toRegionNameNoSpace(region.displayName)}`,
      })
    })
  }

  readonly buildRegionDetailHref = buildRegionDetailHref

  private buildRegionMetaDescription(region: Region | null): string {
    if (!region) {
      return 'Explore this Azure region, including its location, availability zones, paired region, approximate opening year, and regional context map.'
    }

    const locationParts = this.buildRegionLocationParts(region)
    const intro = locationParts.length
      ? `Explore ${region.displayName}, an Azure region in ${locationParts.join(', ')}.`
      : `Explore the ${region.displayName} Azure region.`

    return `${intro} See availability zones, paired region, approximate opening year, and regional context map.`
  }

  private buildRegionDescription(region: Region | null): string {
    if (!region)
      return 'Detailed information about this Azure region, including availability, location, and paired region guidance.'

    const locationParts = this.buildRegionLocationParts(region)
    const introSentence = locationParts.length
      ? `${region.displayName} is an Azure region in ${locationParts.join(', ')}.`
      : `${region.displayName} is an Azure region.`

    const detailParts: string[] = []
    if (region.launchYear) {
      detailParts.push(`has a listed location opening year of approximately ${region.launchYear}`)
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
      detailParts.push(this.buildAvailabilityPhrase(region.availableTo))
    }
    const detailSentence = detailParts.length ? `It ${this.joinDetailParts(detailParts)}.` : ''

    const residency = region.dataResidency
      ? region.dataResidency.trim().replace(/\.$/, '') + '.'
      : ''

    return [
      introSentence,
      detailSentence,
      residency,
      'View its approximate region-level location, paired region, and related Azure regions.',
    ]
      .filter(Boolean)
      .join(' ')
  }

  private buildRegionLocationParts(region: Region): string[] {
    return [region.datacenterLocation, region.geography || region.geographicGroup]
      .map((value) => value.trim())
      .filter(Boolean)
  }

  private buildAvailabilityPhrase(availableTo: string): string {
    const normalized = availableTo.trim().replace(/\.$/, '')
    if (!normalized) return ''

    const availableMatch = normalized.match(/^Available to\s+(.+)$/i)
    if (availableMatch) {
      return `is available to ${this.lowercaseFirst(availableMatch[1])}`
    }

    const reservedForMatch = normalized.match(/^Reserved for\s+(.+)$/i)
    if (reservedForMatch) {
      return `is reserved for ${reservedForMatch[1]}`
    }

    if (/^Reserved access region/i.test(normalized)) {
      return `is a ${this.lowercaseFirst(normalized)}`
    }

    return `is available to ${this.lowercaseFirst(normalized)}`
  }

  private joinDetailParts(parts: string[]): string {
    const usableParts = parts.filter(Boolean)

    if (usableParts.length <= 1) {
      return usableParts[0] ?? ''
    }

    if (usableParts.length === 2) {
      return `${usableParts[0]} and ${usableParts[1]}`
    }

    return `${usableParts.slice(0, -1).join(', ')}, and ${usableParts[usableParts.length - 1]}`
  }

  private lowercaseFirst(value: string): string {
    if (/^[A-Z]{2,}\b/.test(value)) {
      return value
    }

    return value.charAt(0).toLowerCase() + value.slice(1)
  }
}
