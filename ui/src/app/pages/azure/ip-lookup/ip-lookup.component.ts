import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  OnInit,
  PLATFORM_ID,
  signal,
  untracked,
} from '@angular/core'
import { form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals'
import { EmptyError, firstValueFrom, Subject, takeUntil, timeout, TimeoutError } from 'rxjs'

import { RegionModel } from '../../../models'
import { RegionService } from '../../../services/region.service'
import { SeoService } from '../../../services/seo.service'
import { buildServiceTagHref } from '../../../services/service-tag-hrefs'
import { API_ENDPOINT } from '../../../shared/constants'
import { CopyButtonComponent } from '../../../shared/copy-button/copy-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildRegionDetailHref, normalizeUrlToken } from '../../../shared/utils'

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9A-Za-z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1\d|)\d)\.){3,3}(25[0-5]|(2[0-4]|1\d|)\d)|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1\d|)\d)\.){3,3}(25[0-5]|(2[0-4]|1\d|)\d))$/
const DOMAIN_REGEX = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$/i
const IP_LOOKUP_ROUTE = '/Azure/IPLookup'
const IP_LOOKUP_API_PATH = '/api/ipAddress'
const LOOKUP_TIMEOUT_MS = 15_000

const LOOKUP_EXAMPLES = [
  { label: 'Azure IPv4', value: '104.45.231.79' },
  { label: 'Azure IPv6', value: '2603:1030:0800:0005:0000:0000:BFEE:A418' },
  { label: 'Azure domain', value: 'www.azure.com' },
] as const

const NETWORK_FEATURE_LEGEND = [
  { code: 'API', label: 'Service Tag Discovery API' },
  { code: 'NSG', label: 'Network Security Group rules' },
  { code: 'UDR', label: 'User-defined routes' },
  { code: 'FW', label: 'Azure Firewall' },
  { code: 'VSE', label: 'Virtual network service endpoints' },
] as const

const SERVICE_TAG_REGION_ALIASES: Readonly<Record<string, string>> = {
  centralfrance: 'francecentral',
  chilec: 'chilecentral',
  germanyn: 'germanynorth',
  germanywc: 'germanywestcentral',
  indiasouthcentral: 'southcentralindia',
  southafricanorth: 'southafricanorth',
  switzerlandn: 'switzerlandnorth',
  switzerlandw: 'switzerlandwest',
}

interface IpAddress {
  serviceTagId: string
  ipAddress: string
  ipAddressPrefix: string
  region: string
  systemService: string
  networkFeatures: string
}

interface IpAddressResult extends IpAddress {
  readonly key: string
  readonly networkFeatureCodes: readonly string[]
  readonly regionDisplayName: string
  readonly regionHref: string | null
  readonly scopeLabel: 'Global' | 'Regional'
  readonly systemServiceDisplayName: string
}

interface ApiExample {
  readonly label: string
  readonly value: string
  readonly url: string
}

@Component({
  selector: 'app-ip-lookup',
  imports: [FormField, LucideIconComponent, CopyButtonComponent],
  templateUrl: './ip-lookup.component.html',
  host: { class: 'block' },
})
export class IPLookupComponent implements OnInit {
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)
  private readonly document = inject(DOCUMENT)
  private readonly regionService = inject(RegionService)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly lookupCancellation = new Subject<void>()
  private readonly regionLookup = buildRegionLookup(this.regionService.getAllRegions())
  private lookupRequestId = 0
  readonly ipOrDomain = input<string | undefined>(undefined)

  readonly isLoading = signal(false)
  readonly hasCompletedLookup = signal(false)
  readonly currentSearchTerm = signal('')
  readonly result = signal<readonly IpAddress[]>([])
  readonly errorMessage = signal<string | null>(null)
  readonly shareableUrl = computed(() => {
    if (!this.hasCompletedLookup() || this.errorMessage()) return ''
    return this.buildShareableUrl(this.currentSearchTerm())
  })
  readonly resultRows = computed<readonly IpAddressResult[]>(() =>
    this.result().map((row, index) => this.createResultRow(row, index))
  )
  readonly mostSpecificMatch = computed(() =>
    this.resultRows().reduce<IpAddressResult | null>((best, row) => {
      if (!best) return row
      return getMatchSpecificity(row) > getMatchSpecificity(best) ? row : best
    }, null)
  )
  readonly resolvedIpAddresses = computed(() => [
    ...new Set(this.resultRows().map((row) => row.ipAddress)),
  ])
  readonly resolvedIpAddressesText = computed(() => this.resolvedIpAddresses().join(', '))
  readonly isDomainSearch = computed(() => this.looksLikeDomain(this.currentSearchTerm()))
  readonly lookupStatusMessage = computed(() => {
    const searchTerm = this.currentSearchTerm()
    if (this.isLoading()) return searchTerm ? `Looking up ${searchTerm}.` : 'Looking up address.'

    const error = this.errorMessage()
    if (error) return error
    if (!this.hasCompletedLookup()) return ''

    const count = this.resultRows().length
    return count
      ? `${count} Azure service tag ${count === 1 ? 'match' : 'matches'} found for ${searchTerm}.`
      : `No Azure Public Cloud service tag matches found for ${searchTerm}.`
  })

  protected readonly lookupExamples = LOOKUP_EXAMPLES
  protected readonly networkFeatureLegend = NETWORK_FEATURE_LEGEND
  protected readonly apiExamples: readonly ApiExample[] = LOOKUP_EXAMPLES.map((example) => ({
    ...example,
    url: `${API_ENDPOINT}${IP_LOOKUP_API_PATH}?ipOrDomain=${encodeURIComponent(example.value)}`,
  }))

  readonly lookupModel = linkedSignal(() => ({
    ipOrDomain: this.normalizeInput(this.ipOrDomain()),
  }))
  readonly ipLookupForm = form(
    this.lookupModel,
    (path) => {
      required(path.ipOrDomain, { message: 'An IP address or domain name is required.' })
      maxLength(path.ipOrDomain, 253, { message: 'Enter 253 characters or fewer.' })
      validate(path.ipOrDomain, ({ value }) => {
        const normalized = this.normalizeInput(value())
        if (!normalized) return undefined
        return this.isValidIpOrDomain(normalized)
          ? undefined
          : {
              kind: 'invalidIpOrDomain',
              message: 'Enter a valid IPv4, IPv6 address, or domain name.',
            }
      })
    },
    { name: 'ipLookup' }
  )

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.lookupRequestId += 1
      this.lookupCancellation.next()
      this.lookupCancellation.complete()
    })

    effect(() => {
      this.updateSeoMeta(this.ipOrDomain())
    })

    effect(() => {
      const inputValue = this.ipOrDomain()
      untracked(() => void this.applyRouteSearchTerm(inputValue))
    })
  }

  ngOnInit(): void {
    this.updateSeoMeta(this.ipOrDomain())
  }

  private updateSeoMeta(inputValue: string | undefined): void {
    this.seoService.setPageMeta({
      title: 'Azure IP and Service Tag Lookup',
      description:
        'Check whether an IP address or domain is associated with Azure Public Cloud ranges. Use the results for network reviews, traffic analysis, and incident triage.',
      canonicalUrl: 'https://www.azurespeed.com/Azure/IPLookup',
      robots: this.normalizeInput(inputValue) ? 'noindex, follow' : undefined,
    })
  }

  async submitForm(event?: Event): Promise<void> {
    event?.preventDefault()

    const normalized = this.normalizeInput(this.lookupModel().ipOrDomain)
    if (this.lookupModel().ipOrDomain !== normalized) {
      this.lookupModel.set({ ipOrDomain: normalized })
    }

    await submit(this.ipLookupForm, async () => {
      if (this.normalizeInput(this.ipOrDomain()) === normalized) {
        await this.performLookup(normalized)
        return undefined
      }

      this.document.defaultView?.location.assign(this.buildLookupPageHref(normalized))
      return undefined
    })
  }

  private applyRouteSearchTerm(inputValue: string | undefined): void {
    if (!inputValue) {
      this.ipLookupForm().reset()
      this.clearLookupState()
      return
    }

    const normalized = this.normalizeInput(inputValue)
    if (normalized && inputValue !== normalized) {
      this.document.defaultView?.location.replace(this.buildLookupPageHref(normalized))
      return
    }

    this.ipLookupForm().reset()

    if (this.ipLookupForm.ipOrDomain().invalid()) {
      this.ipLookupForm.ipOrDomain().markAsTouched()
      this.clearLookupState()
      this.document.defaultView?.location.replace(IP_LOOKUP_ROUTE)
      return
    }

    if (
      normalized === this.currentSearchTerm() &&
      (this.isLoading() || this.hasCompletedLookup())
    ) {
      return
    }

    void this.performLookup(normalized)
  }

  private clearLookupState(): void {
    this.lookupRequestId += 1
    this.lookupCancellation.next()
    this.currentSearchTerm.set('')
    this.result.set([])
    this.isLoading.set(false)
    this.hasCompletedLookup.set(false)
    this.errorMessage.set(null)
  }

  private normalizeInput(value: unknown): string {
    if (typeof value !== 'string') return ''

    const trimmed = extractHostname(value.trim())
    if (!trimmed) return ''

    // Domains and IPv6 should be lowercased
    if (this.looksLikeDomain(trimmed) || trimmed.includes(':')) {
      const lower = trimmed.toLowerCase()
      return lower.endsWith('.') ? lower.slice(0, -1) : lower
    }

    return trimmed
  }

  private isValidIpOrDomain(value: string): boolean {
    if (!value) return false
    return IPV4_REGEX.test(value) || IPV6_REGEX.test(value) || this.looksLikeDomain(value)
  }

  private looksLikeDomain(value: string): boolean {
    const candidate = value.endsWith('.') ? value.slice(0, -1) : value
    if (!candidate) return false
    return DOMAIN_REGEX.test(candidate)
  }

  private async performLookup(normalizedInput: string): Promise<void> {
    const requestId = ++this.lookupRequestId
    this.lookupCancellation.next()
    this.result.set([])
    this.isLoading.set(true)
    this.hasCompletedLookup.set(false)
    this.currentSearchTerm.set(normalizedInput)
    this.errorMessage.set(null)

    try {
      const lookupResult = await firstValueFrom(
        this.http
          .get<IpAddress[] | null>(this.buildLookupApiUrl(normalizedInput))
          .pipe(timeout(LOOKUP_TIMEOUT_MS), takeUntil(this.lookupCancellation))
      )
      if (requestId !== this.lookupRequestId) return

      if (!lookupResult) {
        this.errorMessage.set(
          `The lookup service could not resolve or validate "${normalizedInput}". Check the address and try again.`
        )
        this.result.set([])
        return
      }

      this.result.set(lookupResult)
    } catch (error: unknown) {
      if (requestId !== this.lookupRequestId || error instanceof EmptyError) return

      this.errorMessage.set(getLookupErrorMessage(error))
      this.result.set([])
    } finally {
      if (requestId === this.lookupRequestId) {
        this.isLoading.set(false)
        this.hasCompletedLookup.set(true)
      }
    }
  }

  protected lookupExample(value: string): void {
    this.lookupModel.set({ ipOrDomain: value })
    void this.submitForm()
  }

  protected retryLookup(): void {
    const searchTerm = this.currentSearchTerm()
    if (searchTerm) void this.performLookup(searchTerm)
  }

  private createResultRow(row: IpAddress, index: number): IpAddressResult {
    const region = this.resolveRegion(row)
    return {
      ...row,
      key: `${row.ipAddress}|${row.serviceTagId}|${row.ipAddressPrefix}|${index}`,
      networkFeatureCodes: row.networkFeatures.split(/\s+/).filter(Boolean),
      regionDisplayName: region?.displayName ?? getFallbackRegionName(row),
      regionHref: region ? buildRegionDetailHref(region.displayName) : null,
      scopeLabel: row.region ? 'Regional' : 'Global',
      systemServiceDisplayName: row.systemService || 'Not specified',
    }
  }

  private resolveRegion(row: IpAddress): RegionModel | null {
    const normalizedRegion = normalizeUrlToken(row.region)
    if (!normalizedRegion) return null

    const canonicalRegion = SERVICE_TAG_REGION_ALIASES[normalizedRegion] ?? normalizedRegion
    return this.regionLookup.get(canonicalRegion) ?? null
  }

  protected serviceTagHref(serviceTagId: string): string {
    return buildServiceTagHref('public', serviceTagId, false)
  }

  private buildShareableUrl(value: string): string {
    if (!this.isBrowser || !value) {
      return ''
    }

    const origin = this.document.defaultView?.location.origin
    if (!origin) return ''

    return `${origin}${this.buildLookupPageHref(value)}`
  }

  private buildLookupPageHref(value: string): string {
    return `${IP_LOOKUP_ROUTE}/${encodeURIComponent(value)}`
  }

  private buildLookupApiUrl(value: string): string {
    return `${API_ENDPOINT}${IP_LOOKUP_API_PATH}?ipOrDomain=${encodeURIComponent(value)}`
  }
}

function buildRegionLookup(regions: readonly RegionModel[]): ReadonlyMap<string, RegionModel> {
  const lookup = new Map<string, RegionModel>()
  for (const region of regions) {
    lookup.set(normalizeUrlToken(region.regionId), region)
    lookup.set(normalizeUrlToken(region.displayName), region)
  }
  return lookup
}

function extractHostname(value: string): string {
  if (!/^https?:\/\//i.test(value)) return value

  try {
    const hostname = new URL(value).hostname
    return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname
  } catch {
    return value
  }
}

function getFallbackRegionName(row: IpAddress): string {
  if (!row.region) return 'Global'

  const serviceTagSuffix = row.serviceTagId.includes('.')
    ? row.serviceTagId.slice(row.serviceTagId.lastIndexOf('.') + 1)
    : ''
  const displayValue = serviceTagSuffix || row.region
  return displayValue
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
}

function getMatchSpecificity(row: IpAddressResult): number {
  const prefixLength = Number.parseInt(row.ipAddressPrefix.split('/').at(-1) ?? '0', 10)
  const regionalScore = row.scopeLabel === 'Regional' ? 20 : 0
  const serviceScore = row.serviceTagId.startsWith('AzureCloud') ? 0 : 10
  return prefixLength * 100 + regionalScore + serviceScore
}

function getLookupErrorMessage(error: unknown): string {
  if (error instanceof TimeoutError) {
    return 'The lookup timed out. Check your connection and try again.'
  }
  if (error instanceof HttpErrorResponse && error.status === 429) {
    return 'Too many lookup requests were sent. Wait a moment and try again.'
  }
  return 'The lookup service is unavailable right now. Try again in a moment.'
}
