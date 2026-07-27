import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  PLATFORM_ID,
  signal,
} from '@angular/core'
import { Router } from '@angular/router'

import regionsJson from '../../../../../assets/data/regions.json'
import { Region } from '../../../../models'
import { SeoService } from '../../../../services/seo.service'
import { ServiceTagsLoader } from '../../../../services/service-tags-loader.service'
import {
  isServiceTagPageData,
  normalizeServiceTagCloud,
  normalizeServiceTagIdInput,
  ServiceTagCloud,
  ServiceTagPageData,
  ServiceTagPageRouteData,
} from '../../../../services/service-tags-snapshot'
import { downloadBlob } from '../../../../shared/browser-download'
import { CopyButtonComponent } from '../../../../shared/copy-button/copy-button.component'
import { buildDocumentHref } from '../../../../shared/document-navigation'
import { ExportCsvButtonComponent } from '../../../../shared/export-csv-button/export-csv-button.component'
import { readInputValue } from '../../../../shared/form-control-value'
import { LucideIconComponent } from '../../../../shared/icons/lucide-icons.component'
import { absoluteUrl, buildBreadcrumbList, buildFaqPage } from '../../../../shared/structured-data'

interface ServiceTagInsights {
  serviceTagId: string
  totalPrefixes: number
  ipv4Count: number
  ipv6Count: number
  scopeLabel: string
  serviceLabel: string
  metaDescription: string
}

type BreadcrumbSource = 'service' | 'region'
type AddressFamilyFilter = 'all' | 'ipv4' | 'ipv6'
type PrefixFamily = 'IPv4' | 'IPv6'
type AllPrefixesDataState = 'idle' | 'loading' | 'loaded' | 'error'
type PageRetryState = 'idle' | 'loading' | 'loaded' | 'error'

const BREADCRUMB_DIRECTORIES: Readonly<Record<BreadcrumbSource, { name: string; path: string }>> = {
  service: {
    name: 'Azure IP ranges by service',
    path: '/Information/AzureIpRangesByService',
  },
  region: {
    name: 'Azure IP ranges by region',
    path: '/Information/AzureIpRangesByRegion',
  },
}

interface PrefixRow {
  prefix: string
  family: PrefixFamily
  cidrLength: string
  searchText: string
}

interface FilterOption<T extends string> {
  value: T
  label: string
}

interface SummaryMetric {
  label: string
  value: number
}

const REGION_LOOKUP = new Map<string, Region>(
  (regionsJson as Region[]).map((region) => [region.regionId.toLowerCase(), region])
)
const SOURCE_LABEL = 'Microsoft Service Tags'
const SOURCE_FAQ = {
  question: 'Where do these IP ranges come from, and how often are they updated?',
  answer:
    'This page uses Microsoft Azure Service Tags data. Microsoft normally publishes downloadable service-tag files weekly. Review the official download when you need the latest published ranges.',
} as const
const SERVICE_TAG_CLOUD_LABELS: Readonly<Record<ServiceTagCloud, string>> = {
  public: 'Azure Public',
  china: 'Azure China',
  usgovernment: 'Azure US Government',
}
const FAMILY_FILTER_OPTIONS: readonly FilterOption<AddressFamilyFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'ipv4', label: 'IPv4' },
  { value: 'ipv6', label: 'IPv6' },
]
const COUNT_FORMATTER = new Intl.NumberFormat('en-US')

function isIpv4Prefix(prefix: string): boolean {
  return prefix.includes('.')
}

function buildPrefixRow(prefix: string): PrefixRow {
  const family: PrefixFamily = isIpv4Prefix(prefix) ? 'IPv4' : 'IPv6'
  const cidrLength = prefix.includes('/') ? `/${prefix.split('/').pop() ?? ''}` : ''
  return {
    prefix,
    family,
    cidrLength,
    searchText: `${prefix} ${family} ${cidrLength}`.toLowerCase(),
  }
}

function sanitizeFilePart(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned || 'azure-ip-ranges'
}

function normalizeBreadcrumbSourceInput(value: string | undefined): BreadcrumbSource | undefined {
  return value === 'region' || value === 'service' ? value : undefined
}

@Component({
  selector: 'app-azure-ip-ranges',
  imports: [LucideIconComponent, CopyButtonComponent, ExportCsvButtonComponent],
  templateUrl: './azure-ip-ranges.component.html',
  styleUrl: './azure-ip-ranges.component.css',
  host: {
    class: 'block',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class AzureIpRangesComponent {
  readonly buildDocumentHref = buildDocumentHref
  private readonly seoService = inject(SeoService)
  private readonly serviceTagsLoader = inject(ServiceTagsLoader)
  private readonly router = inject(Router)
  private readonly document = inject(DOCUMENT)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))

  readonly familyFilterOptions = FAMILY_FILTER_OPTIONS
  readonly sourceFaq = SOURCE_FAQ
  readonly cloud = input<ServiceTagCloud, string | undefined>('public', {
    transform: normalizeServiceTagCloud,
  })
  readonly source = input<BreadcrumbSource | undefined, string | undefined>(undefined, {
    transform: normalizeBreadcrumbSourceInput,
  })
  readonly serviceTagId = input('AzureCloud', { transform: normalizeServiceTagIdInput })
  readonly serviceTagPageData = input<ServiceTagPageRouteData>(null)
  readonly prefixSearchModel = signal({ search: '' })
  readonly familyFilter = signal<AddressFamilyFilter>('all')
  readonly retryPageData = linkedSignal<ServiceTagPageData | null>(() => {
    this.cloud()
    this.serviceTagId()
    return null
  })
  readonly pageRetryState = linkedSignal<PageRetryState>(() => {
    this.cloud()
    this.serviceTagId()
    return 'idle'
  })
  readonly retryPageError = linkedSignal<string>(() => {
    this.cloud()
    this.serviceTagId()
    return ''
  })
  readonly allPrefixesDataState = linkedSignal<AllPrefixesDataState>(() => {
    this.cloud()
    this.serviceTagId()
    return 'idle'
  })
  readonly allPrefixesDataError = linkedSignal<string>(() => {
    this.cloud()
    this.serviceTagId()
    return ''
  })
  readonly allPrefixesPageData = linkedSignal<ServiceTagPageData | null>(() => {
    this.cloud()
    this.serviceTagId()
    return null
  })
  readonly pageData = computed<ServiceTagPageData | undefined>(() => {
    const retryData = this.retryPageData()
    if (retryData) return retryData

    const routeData = this.serviceTagPageData()
    return isServiceTagPageData(routeData) ? routeData : undefined
  })
  readonly isImplicitCloudRoute = computed(() => {
    const retryData = this.retryPageData()
    if (retryData?.implicitCloudRoute !== undefined) return retryData.implicitCloudRoute

    return Boolean(this.serviceTagPageData()?.implicitCloudRoute)
  })
  readonly effectiveCloud = computed<ServiceTagCloud>(() => {
    const pageData = this.pageData()
    if (pageData) return pageData.cloud

    const routeData = this.serviceTagPageData()
    return routeData?.cloud ?? this.cloud()
  })
  readonly pageLoadError = computed(() => {
    if (this.retryPageData()) return ''
    if (this.retryPageError()) return this.retryPageError()

    const routeData = this.serviceTagPageData()
    return routeData && 'error' in routeData ? routeData.error : ''
  })
  readonly activePageData = computed<ServiceTagPageData | undefined>(
    () => this.allPrefixesPageData() ?? this.pageData()
  )
  readonly canLoadAllPrefixes = computed(() => {
    const data = this.pageData()
    if (!data) return false
    return !data.prefixesComplete
  })
  readonly allPrefixesLoaded = computed(() => {
    const data = this.activePageData()
    if (!data) return false
    return data.prefixesComplete
  })
  readonly breadcrumbSource = computed<BreadcrumbSource>(
    () => this.source() ?? this.resolveBreadcrumbSource(this.serviceTagId())
  )
  readonly cloudLabel = computed(() => SERVICE_TAG_CLOUD_LABELS[this.effectiveCloud()])
  readonly pageKey = computed(() => `${this.effectiveCloud()}/${this.serviceTagId()}`)
  readonly directoryQueryParams = computed(() =>
    this.effectiveCloud() === 'public' ? undefined : { cloud: this.effectiveCloud() }
  )
  readonly tagInsights = computed(() => this.buildServiceTagInsights())
  readonly summaryMetrics = computed<readonly SummaryMetric[]>(() => {
    const insights = this.tagInsights()
    const visibleCount = this.prefixRows().length

    return [
      { label: 'Total prefixes', value: insights.totalPrefixes },
      { label: 'IPv4', value: insights.ipv4Count },
      { label: 'IPv6', value: insights.ipv6Count },
      { label: 'Loaded here', value: visibleCount },
    ]
  })
  readonly prefixRows = computed<readonly PrefixRow[]>(() =>
    (this.activePageData()?.ipAddressPrefixes ?? []).map(buildPrefixRow)
  )
  readonly filteredPrefixRows = computed<readonly PrefixRow[]>(() => {
    const query = this.prefixSearchModel().search.trim().toLowerCase()
    const familyFilter = this.familyFilter()

    return this.prefixRows().filter((row) => {
      const matchesFamily =
        familyFilter === 'all' ||
        (familyFilter === 'ipv4' && row.family === 'IPv4') ||
        (familyFilter === 'ipv6' && row.family === 'IPv6')
      const matchesSearch = !query || row.searchText.includes(query)
      return matchesFamily && matchesSearch
    })
  })
  readonly filteredPartitionedAddresses = computed(() => {
    const ipv4: PrefixRow[] = []
    const ipv6: PrefixRow[] = []

    for (const row of this.filteredPrefixRows()) {
      if (row.family === 'IPv4') ipv4.push(row)
      else ipv6.push(row)
    }

    return { ipv4, ipv6 }
  })
  readonly renderedResultLabel = computed(() => {
    const filteredCount = this.filteredPrefixRows().length

    return `${this.formatCount(filteredCount)} matches`
  })
  readonly prefixLoadStatusLabel = computed(() => {
    const data = this.pageData()
    const activeData = this.activePageData()
    if (!data || !activeData) return ''

    if (this.allPrefixesLoaded()) {
      return `Searching all ${this.formatCount(data.totalPrefixCount)} prefixes.`
    }

    return `Preview loaded: ${this.formatCount(activeData.loadedPrefixCount)} of ${this.formatCount(data.totalPrefixCount)} prefixes.`
  })
  readonly copyAllLabel = computed(() => (this.allPrefixesLoaded() ? 'Copy All' : 'Copy Preview'))
  readonly copyText = computed(() => {
    const prefixes = this.activePageData()?.ipAddressPrefixes
    return prefixes?.length ? prefixes.join('\n') : ''
  })
  readonly ipv4CopyText = computed(() => this.partitionedAddresses().ipv4.join('\n'))
  readonly ipv6CopyText = computed(() => this.partitionedAddresses().ipv6.join('\n'))
  readonly visibleCopyText = computed(() =>
    this.filteredPrefixRows()
      .map((row) => row.prefix)
      .join('\n')
  )
  readonly visibleJsonText = computed(() => {
    const prefixes = this.filteredPrefixRows().map((row) => row.prefix)
    if (!prefixes.length) return ''

    const data = this.activePageData()
    return JSON.stringify(
      {
        cloud: data?.cloud ?? this.effectiveCloud(),
        serviceTagId: data?.serviceTagId ?? this.serviceTagId(),
        source: SOURCE_LABEL,
        prefixCount: prefixes.length,
        ipAddressPrefixes: prefixes,
      },
      null,
      2
    )
  })
  readonly csvRows = computed<string[][]>(() =>
    this.filteredPrefixRows().map((row) => [row.prefix, row.family, row.cidrLength])
  )
  readonly exportFilename = computed(
    () =>
      `azure-ip-ranges-${this.effectiveCloud()}-${sanitizeFilePart(this.activePageData()?.serviceTagId ?? this.serviceTagId())}`
  )
  readonly hasActiveFilter = computed(
    () => this.familyFilter() !== 'all' || Boolean(this.prefixSearchModel().search.trim())
  )
  readonly partitionedAddresses = computed(() => {
    const prefixes = this.activePageData()?.ipAddressPrefixes ?? []
    const ipv4: string[] = []
    const ipv6: string[] = []
    for (const prefix of prefixes) {
      if (isIpv4Prefix(prefix)) {
        ipv4.push(prefix)
      } else {
        ipv6.push(prefix)
      }
    }
    return { ipv4, ipv6 }
  })
  constructor() {
    effect(() => {
      const query = this.prefixSearchModel().search.trim()
      if (query && this.canLoadAllPrefixes() && this.allPrefixesDataState() === 'idle') {
        void this.loadAllPrefixes()
      }
    })
    effect(() => this.updateSeoProperties())
  }

  setFamilyFilter(filter: AddressFamilyFilter): void {
    this.familyFilter.set(filter)
  }

  clearSearch(): void {
    if (this.prefixSearchModel().search) this.prefixSearchModel.set({ search: '' })
  }

  updateSearch(event: Event): void {
    this.prefixSearchModel.set({ search: readInputValue(event) })
  }

  resetFilters(): void {
    this.prefixSearchModel.set({ search: '' })
    this.familyFilter.set('all')
  }

  async loadAllPrefixes(): Promise<void> {
    const cloud = this.effectiveCloud()
    const serviceTagId = this.serviceTagId()
    const initialData = this.pageData()

    if (!initialData || initialData.prefixesComplete) {
      return
    }

    const currentState = this.allPrefixesDataState()
    if (currentState === 'loading' || currentState === 'loaded') return

    this.allPrefixesDataState.set('loading')
    this.allPrefixesDataError.set('')

    try {
      const data = await this.serviceTagsLoader.getAllPrefixesServiceTagPageData(
        cloud,
        serviceTagId
      )
      if (this.effectiveCloud() !== cloud || this.serviceTagId() !== serviceTagId) return

      if (!data || !data.prefixesComplete || data.ipAddressPrefixes.length === 0) {
        this.allPrefixesDataState.set('error')
        this.allPrefixesDataError.set('All prefixes are not available for this service tag.')
        return
      }

      this.allPrefixesPageData.set(data)
      this.allPrefixesDataState.set('loaded')
    } catch {
      if (this.effectiveCloud() !== cloud || this.serviceTagId() !== serviceTagId) return

      this.allPrefixesDataState.set('error')
      this.allPrefixesDataError.set('All prefixes could not be loaded.')
    }
  }

  async retryLoadPageData(): Promise<void> {
    if (this.pageRetryState() === 'loading') return

    const routeCloud = this.cloud()
    const cloud = this.effectiveCloud()
    const implicitCloudRoute = this.isImplicitCloudRoute()
    const serviceTagId = this.serviceTagId()
    this.pageRetryState.set('loading')
    this.retryPageError.set('')

    try {
      const data = implicitCloudRoute
        ? await this.serviceTagsLoader.reloadImplicitCloudServiceTagPageData(serviceTagId)
        : await this.serviceTagsLoader.reloadServiceTagPageData(cloud, serviceTagId)
      if (this.cloud() !== routeCloud || this.serviceTagId() !== serviceTagId) return

      if (!data) {
        this.pageRetryState.set('error')
        this.retryPageError.set('This service tag is not available in the selected Azure cloud.')
        return
      }

      this.retryPageData.set({ ...data, implicitCloudRoute })
      this.pageRetryState.set('loaded')
    } catch {
      if (this.cloud() !== routeCloud || this.serviceTagId() !== serviceTagId) return
      this.pageRetryState.set('error')
      this.retryPageError.set(
        'Service tag data could not be loaded. Check your connection and try again.'
      )
    }
  }

  onEscape(): void {
    this.clearSearch()
  }

  downloadVisibleText(): void {
    this.downloadFile('txt', this.visibleCopyText(), 'text/plain;charset=utf-8;')
  }

  downloadVisibleJson(): void {
    this.downloadFile('json', this.visibleJsonText(), 'application/json;charset=utf-8;')
  }

  private updateSeoProperties(): void {
    const insights = this.tagInsights()
    const currentServiceTag = this.serviceTagId()
    const cloud = this.effectiveCloud()
    const canonicalPath = this.isImplicitCloudRoute()
      ? `/Information/AzureIpRanges/${currentServiceTag}`
      : `/Information/AzureIpRanges/${cloud}/${currentServiceTag}`
    const breadcrumbDirectory = BREADCRUMB_DIRECTORIES[this.breadcrumbSource()]
    this.seoService.setPageMeta({
      title: `${currentServiceTag} IP Ranges | ${SERVICE_TAG_CLOUD_LABELS[cloud]}`,
      description: insights.metaDescription,
      canonicalUrl: absoluteUrl(canonicalPath),
      structuredData: [
        buildBreadcrumbList([
          { name: 'Home', path: '/Azure/Latency' },
          { name: breadcrumbDirectory.name, path: breadcrumbDirectory.path },
          { name: currentServiceTag, path: canonicalPath },
        ]),
        buildFaqPage([SOURCE_FAQ]),
      ],
    })
  }

  private resolveBreadcrumbSource(nextServiceTagId: string): BreadcrumbSource {
    const navSource = this.resolveNavigationSource()
    if (navSource) {
      return navSource
    }

    const normalizedId = nextServiceTagId.toLowerCase()
    const isRegionTag =
      normalizedId.startsWith('azurecloud.') && normalizedId.length > 'azurecloud.'.length

    return isRegionTag ? 'region' : 'service'
  }

  private resolveNavigationSource(): BreadcrumbSource | undefined {
    const extractSource = (
      state: { source?: unknown } | undefined
    ): BreadcrumbSource | undefined => {
      const source = state?.source
      return source === 'service' || source === 'region' ? source : undefined
    }

    const navState = this.router.getCurrentNavigation()?.extras.state as
      { source?: unknown } | undefined
    const navSource = extractSource(navState)
    if (navSource) return navSource

    if (this.isBrowser) {
      return extractSource(
        this.document.defaultView?.history.state as { source?: unknown } | undefined
      )
    }

    return undefined
  }

  private buildServiceTagInsights(): ServiceTagInsights {
    const serviceTagId = this.serviceTagId()
    const pageData = this.pageData()
    const totalPrefixes = pageData?.totalPrefixCount ?? 0
    const ipv4Count = pageData?.ipv4PrefixCount ?? 0
    const ipv6Count = pageData?.ipv6PrefixCount ?? 0

    const scopeSegments = serviceTagId.split('.').slice(1)

    const regionCandidate =
      pageData?.regionId ??
      (scopeSegments.length > 0 ? scopeSegments[scopeSegments.length - 1].toLowerCase() : undefined)
    const regionDetail =
      this.effectiveCloud() === 'public' && regionCandidate
        ? REGION_LOOKUP.get(regionCandidate)
        : undefined

    let scopeLabel: string | undefined
    if (pageData?.scope !== 'global') {
      if (regionDetail) {
        scopeLabel = regionDetail.displayName
      } else if (scopeSegments.length) {
        scopeLabel = scopeSegments
          .map((segment) => this.humanizeServiceSegment(segment))
          .join(' › ')
      }
    }
    const metaDescription = this.buildMetaDescription({
      serviceTagId,
      scopeLabel,
      regionDetail,
      totalPrefixes,
      ipv4Count,
      ipv6Count,
      cloudLabel: this.cloudLabel(),
    })

    return {
      serviceTagId,
      totalPrefixes,
      ipv4Count,
      ipv6Count,
      scopeLabel: scopeLabel ?? 'Global',
      serviceLabel: serviceTagId.split('.')[0] || serviceTagId,
      metaDescription,
    }
  }

  private humanizeServiceSegment(segment: string): string {
    if (!segment) return ''

    const cleaned = segment.replace(/[_-]+/g, ' ')
    const isLowerCase = cleaned.toLowerCase() === cleaned
    const spaced = isLowerCase ? cleaned : cleaned.replace(/([a-z\d])([A-Z])/g, '$1 $2')
    return spaced.replace(/\b\w/g, (char) => char.toUpperCase()).trim()
  }

  private buildMetaDescription(context: {
    serviceTagId: string
    scopeLabel?: string
    regionDetail?: Region
    totalPrefixes: number
    ipv4Count: number
    ipv6Count: number
    cloudLabel: string
  }): string {
    const rangeSummary: string[] = []
    if (context.ipv4Count > 0) rangeSummary.push(`${context.ipv4Count} IPv4`)
    if (context.ipv6Count > 0) rangeSummary.push(`${context.ipv6Count} IPv6`)

    let scopePart = ''
    if (context.scopeLabel) scopePart = ` for ${context.scopeLabel}`
    else if (context.regionDetail) scopePart = ` in the ${context.regionDetail.displayName} region`

    const rangeText = rangeSummary.length ? `, including ${rangeSummary.join(' and ')}` : ''

    if (context.totalPrefixes === 0) {
      return `Browse ${context.cloudLabel} address prefixes for the ${context.serviceTagId} service tag.`
    }

    return `${context.cloudLabel} service tag ${context.serviceTagId}${scopePart} lists ${context.totalPrefixes} IP prefixes${rangeText}.`
  }

  private formatCount(value: number): string {
    return COUNT_FORMATTER.format(value)
  }

  private downloadFile(extension: 'json' | 'txt', content: string, type: string): void {
    if (!this.isBrowser || !content) return

    const date = new Date().toISOString().split('T')[0]
    const filename = `${this.exportFilename()}-${date}.${extension}`
    downloadBlob(this.document, filename, new Blob([content], { type }))
  }
}
