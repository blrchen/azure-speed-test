import { isPlatformBrowser } from '@angular/common'
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core'

export interface CloudflareMetaResponse {
  clientIp: string
  asn: number | null
  asOrganization: string | null
  city?: string
  colo?: string
  country?: string
}

@Injectable({ providedIn: 'root' })
export class CloudflareMetaStore {
  private readonly platformId = inject(PLATFORM_ID)
  private readonly isBrowser = isPlatformBrowser(this.platformId)
  private readonly meta = signal<CloudflareMetaResponse | null>(null)
  private readonly errorState = signal<string | null>(null)
  private readonly loading = signal(true)
  private readonly visible = signal(true)
  private metaFetchAbortController: AbortController | null = null

  public readonly isLoading = this.loading.asReadonly()
  public readonly error = this.errorState.asReadonly()
  public readonly isVisible = this.visible.asReadonly()
  public readonly viewerNetworkLabel = computed(() => {
    const meta = this.meta()
    if (!meta) {
      return null
    }

    const organization = meta.asOrganization?.trim()
    const asn = meta.asn && meta.asn > 0 ? Math.trunc(meta.asn) : null

    if (organization && asn) {
      return `${organization} (AS${asn})`
    }

    if (organization) {
      return organization
    }

    if (asn) {
      return `AS${asn}`
    }

    return null
  })
  public readonly viewerIpLabel = computed(() => this.meta()?.clientIp ?? null)
  public readonly viewerLocationLabel = computed(() => {
    const meta = this.meta()
    if (!meta) {
      return null
    }

    const parts: string[] = []

    if (meta.city) {
      parts.push(meta.city)
    }

    if (meta.country) {
      parts.push(meta.country)
    }

    if (meta.colo) {
      parts.push(`(${meta.colo})`)
    }

    return parts.length > 0 ? parts.join(', ') : null
  })

  async load(): Promise<void> {
    if (!this.isBrowser) {
      return
    }

    this.abortOngoingRequest()

    const controller = new AbortController()
    this.metaFetchAbortController = controller
    this.loading.set(true)
    this.errorState.set(null)

    try {
      const response = await fetch('https://speed.cloudflare.com/meta', {
        cache: 'no-store',
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const raw = (await response.json()) as unknown
      const parsed = this.parse(raw)

      if (!parsed) {
        throw new Error('Unexpected response shape')
      }

      this.meta.set(parsed)
    } catch (error) {
      if (this.isAbortError(error)) {
        return
      }

      this.meta.set(null)
      this.errorState.set('Unable to determine your network details.')
    } finally {
      if (this.metaFetchAbortController === controller) {
        this.metaFetchAbortController = null
      }
      this.loading.set(false)
    }
  }

  toggleVisibility(): void {
    this.visible.update((current) => !current)
  }

  destroy(): void {
    this.abortOngoingRequest()
  }

  private abortOngoingRequest(): void {
    if (this.metaFetchAbortController) {
      this.metaFetchAbortController.abort()
      this.metaFetchAbortController = null
    }
  }

  private parse(raw: unknown): CloudflareMetaResponse | null {
    if (!raw || typeof raw !== 'object') {
      return null
    }

    const record = raw as Record<string, unknown>

    const clientIpValue = record['clientIp']
    const clientIp = typeof clientIpValue === 'string' ? clientIpValue.trim() : ''
    if (!clientIp) {
      return null
    }

    const organizationValue = record['asOrganization']
    const organization =
      typeof organizationValue === 'string' && organizationValue.trim().length
        ? organizationValue.trim()
        : null

    const asnValue = record['asn']
    let asn: number | null = null
    if (typeof asnValue === 'number' && Number.isFinite(asnValue)) {
      asn = Math.trunc(Math.abs(asnValue))
    } else if (typeof asnValue === 'string') {
      const parsed = Number.parseInt(asnValue, 10)
      if (Number.isFinite(parsed)) {
        asn = Math.trunc(Math.abs(parsed))
      }
    }

    const city = typeof record['city'] === 'string' ? record['city'] : undefined
    const colo = typeof record['colo'] === 'string' ? record['colo'] : undefined
    const country = typeof record['country'] === 'string' ? record['country'] : undefined

    return {
      clientIp,
      asn: asn && asn > 0 ? asn : null,
      asOrganization: organization,
      city,
      colo,
      country
    }
  }

  private isAbortError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false
    }

    const maybeError = error as { name?: unknown }
    return typeof maybeError.name === 'string' && maybeError.name === 'AbortError'
  }
}
