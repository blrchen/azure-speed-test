import { isPlatformBrowser } from '@angular/common'
import { computed, DestroyRef, inject, PLATFORM_ID, Service, signal } from '@angular/core'

export interface CloudflareMetaResponse {
  clientIp: string
  asn: number | null
  asOrganization: string | null
  city?: string
  colo?: string
  country?: string
}

@Service({ autoProvided: false })
export class CloudflareMetaStore {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly meta = signal<CloudflareMetaResponse | null>(null)
  private readonly loading = signal(false)
  private readonly visible = signal(false)
  private metaFetchAbortController: AbortController | null = null
  private hasLoaded = false

  readonly isLoading = this.loading.asReadonly()
  readonly isVisible = this.visible.asReadonly()
  readonly viewerNetworkLabel = computed(() => {
    const meta = this.meta()
    if (!meta) return null

    const { asOrganization, asn } = meta
    const asnLabel = asn ? `AS${asn}` : null
    if (asOrganization && asnLabel) return `${asOrganization} (${asnLabel})`
    return asOrganization ?? asnLabel
  })
  readonly viewerIpLabel = computed(() => this.meta()?.clientIp ?? null)
  readonly viewerLocationLabel = computed(() => {
    const meta = this.meta()
    if (!meta) return null

    const parts = [meta.city, meta.country, meta.colo ? `(${meta.colo})` : null].filter(Boolean)
    return parts.join(', ') || null
  })

  constructor() {
    inject(DestroyRef).onDestroy(() => this.abortOngoingRequest())
  }

  async load(): Promise<void> {
    if (!this.isBrowser || this.hasLoaded || this.loading()) {
      return
    }

    this.abortOngoingRequest()

    const controller = new AbortController()
    this.metaFetchAbortController = controller
    this.loading.set(true)

    try {
      const response = await fetch('https://speed.cloudflare.com/meta', {
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const raw = (await response.json()) as unknown
      const parsed = this.parse(raw)

      if (!parsed) {
        throw new Error('Unexpected response shape')
      }

      if (this.isActiveRequest(controller)) {
        this.meta.set(parsed)
        this.hasLoaded = true
      }
    } catch (error) {
      if (this.isAbortError(error) || !this.isActiveRequest(controller)) {
        return
      }
      this.meta.set(null)
    } finally {
      const isLatestRequest = this.isActiveRequest(controller)
      const hasNewerRequest = !isLatestRequest

      if (isLatestRequest) {
        this.metaFetchAbortController = null
      }

      if (!hasNewerRequest) {
        this.loading.set(false)
      }
    }
  }

  toggleVisibility(): void {
    this.visible.update((current) => !current)
  }

  private abortOngoingRequest(): void {
    this.metaFetchAbortController?.abort()
    this.metaFetchAbortController = null
  }

  private parse(raw: unknown): CloudflareMetaResponse | null {
    const data = raw as Record<string, unknown> | null
    if (!data || typeof data !== 'object') {
      return null
    }

    const clientIp = typeof data['clientIp'] === 'string' ? data['clientIp'].trim() : ''
    if (!clientIp) {
      return null
    }

    const orgValue = data['asOrganization']
    const asOrganization = typeof orgValue === 'string' && orgValue.trim() ? orgValue.trim() : null

    return {
      clientIp,
      asn: this.parseAsn(data['asn']),
      asOrganization,
      city: typeof data['city'] === 'string' ? data['city'] : undefined,
      colo: typeof data['colo'] === 'string' ? data['colo'] : undefined,
      country: typeof data['country'] === 'string' ? data['country'] : undefined,
    }
  }

  private parseAsn(value: unknown): number | null {
    if (typeof value !== 'number' && typeof value !== 'string') return null
    const num = typeof value === 'number' ? value : parseInt(value, 10)
    return Number.isFinite(num) && num > 0 ? Math.trunc(num) : null
  }

  private isActiveRequest(controller: AbortController): boolean {
    return this.metaFetchAbortController === controller
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError'
  }
}
