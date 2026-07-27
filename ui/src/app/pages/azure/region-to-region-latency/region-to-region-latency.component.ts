import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  OnInit,
  PLATFORM_ID,
} from '@angular/core'

import { RegionLatencyResult } from '../../../models'
import { RegionLatencyService } from '../../../services/region-latency.service'
import { SeoService } from '../../../services/seo.service'
import { WidthPercentDirective } from '../../../shared/directives/width-percent.directive'
import { readInputValue, readSelectValue } from '../../../shared/form-control-value'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { absoluteUrl, buildFaqPage } from '../../../shared/structured-data'
import {
  buildRegionDetailHref,
  buildRegionLatencyHref,
  LatencyTone,
  normalizeUrlToken,
  REGION_NAME_COLLATOR,
  toRegionNameNoSpace,
} from '../../../shared/utils'

type PublishedLatencyResult = RegionLatencyResult & { latencyMs: number }

interface LatencySummary {
  count: number
  fastest: PublishedLatencyResult
  medianMs: number
  slowest: PublishedLatencyResult
}

const PAGE_LEAD =
  'Compare Azure region-to-region latency to plan faster application paths and choose better deployment locations.'
const LATENCY_SOURCE_FAQ = {
  question: 'Where does this region-to-region latency data come from?',
  answer:
    'The comparison uses Azure network round-trip latency statistics published on Microsoft Learn. Region pairs without a published numeric value are omitted. Published averages are a planning reference; application latency varies with workload, routing, network conditions, and VM configuration.',
} as const
const LATENCY_SOURCE_FAQ_STRUCTURED_DATA = buildFaqPage([LATENCY_SOURCE_FAQ])

@Component({
  selector: 'app-region-to-region-latency',
  imports: [LucideIconComponent, WidthPercentDirective],
  templateUrl: './region-to-region-latency.component.html',
  styleUrl: './region-to-region-latency.component.css',
  host: { class: 'block' },
})
export class RegionToRegionLatencyComponent implements OnInit {
  private readonly seoService = inject(SeoService)
  private readonly regionLatencyService = inject(RegionLatencyService)
  private readonly document = inject(DOCUMENT)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  readonly sourceRegion = input<string | undefined>(undefined)

  readonly pageLead = PAGE_LEAD
  readonly latencySourceFaq = LATENCY_SOURCE_FAQ
  readonly sourceRegions = this.regionLatencyService.getSourceRegions()

  private readonly normalizedSourceLookup = this.buildNormalizedSourceLookup(this.sourceRegions)

  readonly sourceModel = linkedSignal(() => ({
    sourceRegion: this.resolveSourceFromRouteToken(normalizeUrlToken(this.sourceRegion())),
  }))

  readonly destinationFilterModel = linkedSignal({
    source: () => this.sourceModel().sourceRegion,
    computation: () => ({ search: '' }),
  })

  readonly sortedResults = computed<PublishedLatencyResult[]>(() => {
    return this.regionLatencyService
      .getLatenciesForSource(this.sourceModel().sourceRegion)
      .filter(
        (result): result is RegionLatencyResult & { latencyMs: number } =>
          typeof result.latencyMs === 'number' && Number.isFinite(result.latencyMs)
      )
      .sort((a, b) => {
        if (a.latencyMs !== b.latencyMs) return a.latencyMs - b.latencyMs
        return REGION_NAME_COLLATOR.compare(a.destinationDisplayName, b.destinationDisplayName)
      })
  })

  readonly filteredResults = computed(() => {
    const query = this.destinationFilterModel().search.trim().toLocaleLowerCase('en')
    if (!query) return this.sortedResults()

    return this.sortedResults().filter((result) =>
      result.destinationDisplayName.toLocaleLowerCase('en').includes(query)
    )
  })

  readonly latencySummary = computed<LatencySummary | null>(() => {
    const results = this.sortedResults()
    if (results.length === 0) return null

    const midpoint = Math.floor(results.length / 2)
    const medianMs =
      results.length % 2 === 0
        ? (results[midpoint - 1].latencyMs + results[midpoint].latencyMs) / 2
        : results[midpoint].latencyMs

    return {
      count: results.length,
      fastest: results[0],
      medianMs,
      slowest: results[results.length - 1],
    }
  })

  readonly maxPublishedLatency = this.regionLatencyService.getMaxPublishedLatency()
  readonly pageHeading = computed(() => {
    const source = this.sourceModel().sourceRegion
    return source ? `${source} Azure Region Latency` : 'Azure Region to Region Latency'
  })

  readonly buildRegionDetailHref = buildRegionDetailHref

  private readonly latencyFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  })
  private readonly integerFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  })

  constructor() {
    if (this.isBrowser) {
      this.registerUrlSyncEffect()
    }
    this.registerSeoEffect()
  }

  ngOnInit(): void {
    this.updateSeoMeta()
  }

  getLatencyTone(latencyMs: number | null): LatencyTone {
    if (latencyMs == null || !Number.isFinite(latencyMs)) return 'unknown'
    if (latencyMs < 50) return 'fast'
    if (latencyMs < 100) return 'moderate'
    return 'slow'
  }

  getChartBarWidthPercent(latencyMs: number): number {
    const max = this.maxPublishedLatency
    if (max <= 0) return 0
    return Math.max(0, Math.min(100, (latencyMs / max) * 100))
  }

  getLatencyRating(tone: LatencyTone): string {
    switch (tone) {
      case 'fast':
        return 'Fast'
      case 'moderate':
        return 'Moderate'
      case 'slow':
        return 'Slow'
      default:
        return 'Unknown'
    }
  }

  formatLatency(latencyMs: number): string {
    return this.latencyFormatter.format(latencyMs)
  }

  formatInteger(value: number): string {
    return this.integerFormatter.format(value)
  }

  clearDestinationSearch(): void {
    this.destinationFilterModel.update((model) => ({ ...model, search: '' }))
  }

  updateSourceRegion(event: Event): void {
    this.sourceModel.set({ sourceRegion: readSelectValue(event) })
  }

  updateDestinationSearch(event: Event): void {
    const search = readInputValue(event)
    this.destinationFilterModel.update((model) => ({ ...model, search }))
  }

  private registerSeoEffect(): void {
    effect(() => this.updateSeoMeta())
  }

  private updateSeoMeta(): void {
    const source = this.sourceModel().sourceRegion
    if (source) {
      this.seoService.setPageMeta({
        title: `${source} Azure Region Latency`,
        description: `Compare latency from ${source} to other Azure regions and identify faster deployment paths for globally distributed applications.`,
        canonicalUrl: absoluteUrl(`/Azure/RegionToRegionLatency/${toRegionNameNoSpace(source)}`),
        structuredData: LATENCY_SOURCE_FAQ_STRUCTURED_DATA,
      })
    } else {
      this.seoService.setPageMeta({
        title: 'Azure Region to Region Latency',
        description: PAGE_LEAD,
        canonicalUrl: absoluteUrl('/Azure/RegionToRegionLatency'),
        structuredData: LATENCY_SOURCE_FAQ_STRUCTURED_DATA,
      })
    }
  }

  private registerUrlSyncEffect(): void {
    effect(() => {
      this.syncUrlWithSelection(this.sourceModel().sourceRegion)
    })
  }

  private syncUrlWithSelection(sourceRegion: string): void {
    if (!this.isBrowser) return

    const token = normalizeUrlToken(sourceRegion)
    if (token === normalizeUrlToken(this.sourceRegion())) return

    this.document.defaultView?.location.assign(buildRegionLatencyHref(sourceRegion))
  }

  private resolveSourceFromRouteToken(token: string): string {
    return token ? (this.normalizedSourceLookup.get(token) ?? '') : ''
  }

  private buildNormalizedSourceLookup(sourceRegions: string[]): Map<string, string> {
    const lookup = new Map<string, string>()
    for (const region of sourceRegions) {
      const key = normalizeUrlToken(region)
      if (key && !lookup.has(key)) lookup.set(key, region)
    }
    return lookup
  }
}
