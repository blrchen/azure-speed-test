import { DOCUMENT, isPlatformBrowser, NgOptimizedImage } from '@angular/common'
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
import { form, FormField } from '@angular/forms/signals'

import { RegionLatencyResult } from '../../../models'
import { RegionLatencyService } from '../../../services/region-latency.service'
import { SeoService } from '../../../services/seo.service'
import { WidthPercentDirective } from '../../../shared/directives/width-percent.directive'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
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

@Component({
  selector: 'app-region-to-region-latency',
  imports: [FormField, LucideIconComponent, NgOptimizedImage, WidthPercentDirective],
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

  readonly sourceRegions = this.regionLatencyService.getSourceRegions()

  private readonly normalizedSourceLookup = this.buildNormalizedSourceLookup(this.sourceRegions)

  readonly sourceModel = linkedSignal(() => ({
    sourceRegion: this.resolveSourceFromRouteToken(normalizeUrlToken(this.sourceRegion())),
  }))
  readonly sourceForm = form(this.sourceModel, { name: 'regionLatencySource' })

  readonly destinationFilterModel = linkedSignal({
    source: () => this.sourceModel().sourceRegion,
    computation: () => ({ search: '' }),
  })
  readonly destinationFilterForm = form(this.destinationFilterModel, {
    name: 'regionLatencyDestination',
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
  readonly pageLead = computed(() => {
    const source = this.sourceModel().sourceRegion
    const routeCount = this.sortedResults().length
    if (source && routeCount > 0) {
      return `Compare ${this.formatInteger(routeCount)} Microsoft-published round-trip latency measurements from ${source} to other Azure regions.`
    }

    return 'Compare Microsoft-published round-trip latency between Azure regions to plan application placement and network architecture.'
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

  private registerSeoEffect(): void {
    effect(() => this.updateSeoMeta())
  }

  private updateSeoMeta(): void {
    const source = this.sourceModel().sourceRegion
    if (source) {
      const routeCount = this.sortedResults().length
      this.seoService.setPageMeta({
        title: `${source} Azure Region Latency`,
        description: `Compare ${routeCount} Microsoft-published round-trip latency measurements from ${source} to other Azure regions, including the fastest, median, and slowest routes.`,
        canonicalUrl: `https://www.azurespeed.com/Azure/RegionToRegionLatency/${toRegionNameNoSpace(source)}`,
      })
    } else {
      this.seoService.setPageMeta({
        title: 'Azure Region to Region Latency',
        description:
          'View average latency between Azure datacenters on their backbone network. Compare round-trip times between regions to optimize your application deployment.',
        canonicalUrl: 'https://www.azurespeed.com/Azure/RegionToRegionLatency',
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
