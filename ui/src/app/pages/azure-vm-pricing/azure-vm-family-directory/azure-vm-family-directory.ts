import { Component, computed, inject, input, OnInit, signal } from '@angular/core'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmSeriesHref,
  buildVmSkuHref,
  VmFamiliesDocument,
  VmFamilySummary,
} from '../../../services/vm-catalog'
import { VM_NAME_COLLATOR, VM_NUMBER_FORMATTER } from '../../../services/vm-catalog-view'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildSearchPhrases, matchesSearchPhrases } from '../../../shared/search-normalization'
import { absoluteUrl, buildBreadcrumbList, buildItemList } from '../../../shared/structured-data'
import { VmCatalogNotice } from '../vm-catalog-notice/vm-catalog-notice'

@Component({
  selector: 'app-azure-vm-family-directory',
  imports: [LucideIconComponent, VmCatalogNotice],
  templateUrl: './azure-vm-family-directory.html',
  host: { class: 'block min-w-0' },
})
export class AzureVmFamilyDirectory implements OnInit {
  private readonly seoService = inject(SeoService)

  readonly vmSeriesDirectory = input.required<VmFamiliesDocument>()
  readonly query = signal('')
  readonly seriesSkuCount = computed(() =>
    this.vmSeriesDirectory().families.reduce((total, series) => total + series.skuCount, 0)
  )
  readonly filteredSeries = computed(() => {
    const searchPhrases = buildSearchPhrases(this.query())
    return [...this.vmSeriesDirectory().families]
      .filter((series) => {
        return matchesSearchPhrases(
          [series.series, series.familyGroup ?? '', series.family, series.singletonSku ?? ''].join(
            ' '
          ),
          searchPhrases
        )
      })
      .sort((left, right) => VM_NAME_COLLATOR.compare(left.series, right.series))
  })
  readonly resultSummary = computed(
    () =>
      `${VM_NUMBER_FORMATTER.format(this.filteredSeries().length)} of ${VM_NUMBER_FORMATTER.format(this.vmSeriesDirectory().families.length)} VM series`
  )

  ngOnInit(): void {
    const data = this.vmSeriesDirectory()
    const canonicalPath = '/AzureVmPricing/Series'
    const description = `Browse ${VM_NUMBER_FORMATTER.format(data.counts.familyCount)} Azure VM series across D, E, F, M, N, and other VM families. Compare Linux and Windows pay-as-you-go, savings plan, reserved, and Spot prices, specifications, and pricing coverage by VM size.`
    this.seoService.setPageMeta({
      title: 'Azure VM Series: Sizes, Prices and Specifications',
      description,
      canonicalUrl: absoluteUrl(canonicalPath),
      structuredData: [
        buildBreadcrumbList([
          { name: 'Azure VM Sizes & Pricing', path: '/AzureVmPricing' },
          { name: 'Series', path: canonicalPath },
        ]),
        buildItemList({
          name: 'Azure VM series',
          numberOfItems: data.families.length,
          entries: data.families.map((series) => ({
            name: series.series,
            path: pathForSeries(series),
          })),
        }),
      ],
    })
  }

  updateQuery(value: string): void {
    this.query.set(value.slice(0, 160))
  }

  clearQuery(): void {
    this.query.set('')
  }

  seriesHref(series: VmFamilySummary): string {
    return series.singletonSku
      ? buildVmSkuHref(series.singletonSku)
      : buildVmSeriesHref(series.series)
  }

  formatNumber(value: number): string {
    return VM_NUMBER_FORMATTER.format(value)
  }
}

function pathForSeries(series: VmFamilySummary): string {
  return series.singletonSku
    ? buildVmSkuHref(series.singletonSku)
    : buildVmSeriesHref(series.series)
}
