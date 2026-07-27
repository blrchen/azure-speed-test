import { Component, computed, effect, inject, input } from '@angular/core'
import { Router } from '@angular/router'

import chinaRegionsJson from '../../../../assets/data/regions-china.json'
import govRegionsJson from '../../../../assets/data/regions-usgov.json'
import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services/seo.service'
import { buildAzureCloudRegionServiceTagHref } from '../../../services/service-tag-hrefs'
import { buildVmRegionHref } from '../../../services/vm-catalog'
import { buildDocumentHref } from '../../../shared/document-navigation'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { AzureRegionMapViewComponent } from '../../../shared/region-map/azure-region-map-view.component'
import { absoluteUrl, BreadcrumbEntry, buildBreadcrumbList } from '../../../shared/structured-data'
import { buildRegionDetailHref, toRegionNameNoSpace } from '../../../shared/utils'

type RegionBreadcrumbSource = 'restricted' | 'china' | 'usgov'

const REGION_PAGE_DESCRIPTION =
  "Explore this Azure region's approximate location, infrastructure, availability zones, and nearby regions. Facility-level locations are not shown."

const REGION_BREADCRUMB_MAP: Record<RegionBreadcrumbSource, { label: string; href: string }> = {
  restricted: {
    label: 'Access restricted regions',
    href: '/Information/AzureRestrictedRegions',
  },
  china: {
    label: 'Azure China cloud regions',
    href: '/Information/AzureChinaRegions',
  },
  usgov: {
    label: 'Azure US government cloud regions',
    href: '/Information/AzureUSGovernmentRegions',
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
  imports: [LucideIconComponent, AzureRegionMapViewComponent],
  templateUrl: './azure-region-details.component.html',
  host: { class: 'block' },
})
export class AzureRegionDetailsComponent {
  readonly buildDocumentHref = buildDocumentHref
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

      const canonicalPath = `/Information/AzureRegions/${toRegionNameNoSpace(region.displayName)}`
      const breadcrumbEntries: BreadcrumbEntry[] = [
        { name: 'Home', path: '/Azure/Latency' },
        { name: 'Azure regions', path: '/Information/AzureRegions' },
      ]
      const breadcrumbParent = this.breadcrumbParent()
      if (breadcrumbParent) {
        breadcrumbEntries.push({
          name: breadcrumbParent.label,
          path: breadcrumbParent.href,
        })
      }
      breadcrumbEntries.push({ name: region.displayName, path: canonicalPath })

      this.seoService.setPageMeta({
        title: `${region.displayName} Azure Region`,
        description: this.regionDescription(),
        canonicalUrl: absoluteUrl(canonicalPath),
        structuredData: buildBreadcrumbList(breadcrumbEntries),
      })
    })
  }

  readonly buildRegionDetailHref = buildRegionDetailHref

  private buildRegionDescription(region: Region | null): string {
    if (!region) return REGION_PAGE_DESCRIPTION

    return `Explore the approximate location, infrastructure, availability zones, and nearby regions for ${region.displayName}. Facility-level locations are not shown.`
  }

  private buildRegionLocationParts(region: Region): string[] {
    return [region.datacenterLocation, region.geography || region.geographicGroup]
      .map((value) => value.trim())
      .filter(Boolean)
  }
}
