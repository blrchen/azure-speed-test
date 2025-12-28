import { HttpClient } from '@angular/common/http'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { catchError, of, Subject, switchMap, takeUntil, timeout } from 'rxjs'

import regionsJson from '../../../../assets/data/regions.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { CopyButtonComponent } from '../../../shared/copy-button/copy-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

interface IpAddressPrefix {
  serviceTagId: string
  ipAddressPrefixes: string[]
}

interface ServiceTagInsights {
  serviceTagId: string
  totalPrefixes: number
  metaDescription: string
}

const REGION_LOOKUP = new Map<string, Region>(
  (regionsJson as Region[]).map((region) => [region.regionId.toLowerCase(), region])
)
const SERVICE_TAG_CACHE_KEY = 'azurespeed-ipranges-cache:'

@Component({
  selector: 'app-azure-ip-ranges',
  imports: [RouterLink, LucideIconComponent, CopyButtonComponent],
  templateUrl: './azure-ip-ranges.component.html',
  styleUrl: './azure-ip-ranges.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureIpRangesComponent implements OnInit, OnDestroy {
  readonly tableData = signal<IpAddressPrefix | undefined>(undefined)
  readonly serviceTagId = signal('AzureCloud')
  readonly isLoading = signal(false)
  readonly breadcrumbSource = signal<'service' | 'region'>('service')
  readonly tagInsights = computed<ServiceTagInsights>(() => this.buildServiceTagInsights())
  readonly copyText = computed(() => {
    const prefixes = this.tableData()?.ipAddressPrefixes
    return prefixes?.length ? prefixes.join('\n') : ''
  })
  readonly visibleIpv4Count = signal(100)
  readonly visibleIpv6Count = signal(100)
  private readonly partitionedAddresses = computed(() => {
    const prefixes = this.tableData()?.ipAddressPrefixes ?? []
    const ipv4: string[] = []
    const ipv6: string[] = []
    for (const prefix of prefixes) {
      ;(prefix.includes('.') ? ipv4 : ipv6).push(prefix)
    }
    return { ipv4, ipv6 }
  })
  readonly ipv4Addresses = computed(() => this.partitionedAddresses().ipv4)
  readonly ipv6Addresses = computed(() => this.partitionedAddresses().ipv6)
  readonly visibleIpv4Addresses = computed(() =>
    this.ipv4Addresses().slice(0, this.visibleIpv4Count())
  )
  readonly visibleIpv6Addresses = computed(() =>
    this.ipv6Addresses().slice(0, this.visibleIpv6Count())
  )
  readonly hasMoreIpv4 = computed(() => this.ipv4Addresses().length > this.visibleIpv4Count())
  readonly hasMoreIpv6 = computed(() => this.ipv6Addresses().length > this.visibleIpv6Count())
  readonly remainingIpv4Count = computed(() =>
    Math.max(0, this.ipv4Addresses().length - this.visibleIpv4Count())
  )
  readonly remainingIpv6Count = computed(() =>
    Math.max(0, this.ipv6Addresses().length - this.visibleIpv6Count())
  )
  readonly commonUseCases = [
    'Configure enterprise firewalls for Azure connectivity',
    'Set up network security groups',
    'Plan hybrid cloud network architecture',
    'Implement Azure ExpressRoute configurations'
  ]

  private readonly route = inject(ActivatedRoute)
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)
  private destroy$ = new Subject<void>()
  private readonly serviceTagCache = new Map<string, IpAddressPrefix | null>()

  ngOnInit() {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const paramServiceTagId = params.get('serviceTagId')
          const nextServiceTagId = paramServiceTagId ? paramServiceTagId : 'AzureCloud'
          this.serviceTagId.set(nextServiceTagId)
          this.visibleIpv4Count.set(100)
          this.visibleIpv6Count.set(100)
          this.updateBreadcrumbSource(nextServiceTagId)
          this.updateSeoProperties()
          const cached = this.loadCachedServiceTag(nextServiceTagId)
          if (cached) {
            this.tableData.set(cached)
            this.isLoading.set(false)
          } else {
            this.isLoading.set(true)
            this.tableData.set(undefined)
          }
          return this.http
            .get<IpAddressPrefix>(
              `https://www.azurespeed.com/api/serviceTags/${nextServiceTagId}/ipAddressPrefixes`
            )
            .pipe(
              timeout(7000),
              catchError(() => of(cached))
            )
        })
      )
      .subscribe((data) => {
        if (data) {
          this.tableData.set(data)
          this.saveServiceTagToCache(this.serviceTagId(), data)
        }
        this.isLoading.set(false)
        this.updateSeoProperties()
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private updateSeoProperties(): void {
    const insights = this.tagInsights()
    const currentServiceTag = this.serviceTagId()
    this.seoService.setMetaTitle(`Azure IP Ranges - ${currentServiceTag}`)
    this.seoService.setMetaDescription(insights.metaDescription)
    this.seoService.setCanonicalUrl(
      `https://www.azurespeed.com/Information/AzureIpRanges/${currentServiceTag}`
    )
  }

  private updateBreadcrumbSource(nextServiceTagId: string): void {
    const navSource = this.resolveNavigationSource()
    if (navSource) {
      this.breadcrumbSource.set(navSource)
      return
    }

    const normalizedId = nextServiceTagId.toLowerCase()
    const isRegionTag =
      normalizedId.startsWith('azurecloud.') && normalizedId.length > 'azurecloud.'.length

    this.breadcrumbSource.set(isRegionTag ? 'region' : 'service')
  }

  private resolveNavigationSource(): 'service' | 'region' | undefined {
    const currentNav = this.router.getCurrentNavigation()
    const navState = currentNav?.extras.state as { source?: unknown } | undefined
    const navSource = typeof navState?.source === 'string' ? (navState.source as string) : undefined
    if (navSource === 'service' || navSource === 'region') {
      return navSource
    }

    if (typeof window !== 'undefined') {
      const historyState = window.history.state as { source?: unknown } | undefined
      const historySource =
        typeof historyState?.source === 'string' ? (historyState.source as string) : undefined
      if (historySource === 'service' || historySource === 'region') {
        return historySource
      }
    }

    return undefined
  }

  showMoreIpv4(): void {
    this.visibleIpv4Count.update((count) => count + 200)
  }

  showMoreIpv6(): void {
    this.visibleIpv6Count.update((count) => count + 200)
  }

  showAllIpv4(): void {
    this.visibleIpv4Count.set(this.ipv4Addresses().length)
  }

  showAllIpv6(): void {
    this.visibleIpv6Count.set(this.ipv6Addresses().length)
  }

  private loadCachedServiceTag(serviceTagId: string): IpAddressPrefix | undefined {
    if (this.serviceTagCache.has(serviceTagId)) {
      return this.serviceTagCache.get(serviceTagId) ?? undefined
    }

    const cacheKey = this.buildCacheKey(serviceTagId)
    if (typeof window === 'undefined' || !window.sessionStorage) {
      this.serviceTagCache.set(serviceTagId, null)
      return undefined
    }

    try {
      const raw = window.sessionStorage.getItem(cacheKey)
      if (!raw) {
        this.serviceTagCache.set(serviceTagId, null)
        return undefined
      }
      const parsed = JSON.parse(raw) as IpAddressPrefix | undefined
      if (parsed?.serviceTagId && Array.isArray(parsed.ipAddressPrefixes)) {
        this.serviceTagCache.set(serviceTagId, parsed)
        return parsed
      }
    } catch {
      // Failed to hydrate cached data - continue without cache
    }

    this.serviceTagCache.set(serviceTagId, null)
    return undefined
  }

  private saveServiceTagToCache(serviceTagId: string, data: IpAddressPrefix): void {
    this.serviceTagCache.set(serviceTagId, data)
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return
    }
    try {
      const cacheKey = this.buildCacheKey(serviceTagId)
      window.sessionStorage.setItem(cacheKey, JSON.stringify(data))
    } catch {
      // Failed to persist cache - non-critical, continue silently
    }
  }

  private buildCacheKey(serviceTagId: string): string {
    return `${SERVICE_TAG_CACHE_KEY}${serviceTagId.toLowerCase()}`
  }

  private buildServiceTagInsights(): ServiceTagInsights {
    const serviceTagId = this.serviceTagId()
    const tableData = this.tableData()
    const prefixes = tableData?.ipAddressPrefixes ?? []
    const { ipv4, ipv6 } = this.partitionedAddresses()

    const segments = serviceTagId.split('.')
    const familyKey = segments[0] ?? 'AzureCloud'
    const scopeSegments = segments.slice(1)

    const regionCandidate =
      scopeSegments.length > 0 ? scopeSegments[scopeSegments.length - 1].toLowerCase() : undefined
    const regionDetail = regionCandidate ? REGION_LOOKUP.get(regionCandidate) : undefined

    const familyLabel = this.humanizeServiceSegment(familyKey)
    const scopeLabel = regionDetail
      ? regionDetail.displayName
      : scopeSegments.length
        ? scopeSegments.map((segment) => this.humanizeServiceSegment(segment)).join(' › ')
        : undefined
    const metaDescription = this.buildMetaDescription({
      serviceTagId,
      familyLabel,
      scopeLabel,
      regionDetail,
      totalPrefixes: prefixes.length,
      ipv4Count: ipv4.length,
      ipv6Count: ipv6.length
    })

    return {
      serviceTagId,
      totalPrefixes: prefixes.length,
      metaDescription
    }
  }

  private humanizeServiceSegment(segment: string): string {
    if (!segment) {
      return ''
    }

    const cleaned = segment.replace(/[_-]+/g, ' ')
    if (cleaned.toLowerCase() === cleaned) {
      return cleaned.replace(/\b\w/g, (char) => char.toUpperCase())
    }

    return cleaned
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim()
  }

  private buildMetaDescription(context: {
    serviceTagId: string
    familyLabel: string
    scopeLabel?: string
    regionDetail?: Region
    totalPrefixes: number
    ipv4Count: number
    ipv6Count: number
  }): string {
    const rangeSummary = []
    if (context.ipv4Count > 0) {
      rangeSummary.push(`${context.ipv4Count} IPv4`)
    }
    if (context.ipv6Count > 0) {
      rangeSummary.push(`${context.ipv6Count} IPv6`)
    }

    const scopeText = context.scopeLabel ? ` for ${context.scopeLabel}` : ''
    const regionText =
      !context.scopeLabel && context.regionDetail
        ? ` in the ${context.regionDetail.displayName} region`
        : ''
    const rangeText = rangeSummary.length ? ` featuring ${rangeSummary.join(' and ')} prefixes` : ''

    return `Azure service tag ${context.serviceTagId}${scopeText}${regionText} publishes ${context.totalPrefixes} address blocks${rangeText}.`
  }
}
