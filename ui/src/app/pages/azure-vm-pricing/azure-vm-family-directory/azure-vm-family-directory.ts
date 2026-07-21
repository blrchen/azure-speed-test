import { Component, computed, inject, input, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmSeriesHref,
  buildVmSkuHref,
  VmFamiliesDocument,
  VmFamilySummary,
} from '../../../services/vm-catalog'
import { VM_NAME_COLLATOR, VM_NUMBER_FORMATTER } from '../../../services/vm-catalog-view'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-azure-vm-family-directory',
  imports: [LucideIconComponent, RouterLink],
  templateUrl: './azure-vm-family-directory.html',
  styleUrl: './azure-vm-family-directory.css',
  host: { class: 'block' },
})
export class AzureVmFamilyDirectory implements OnInit {
  private readonly seoService = inject(SeoService)

  readonly vmSeriesDirectory = input.required<VmFamiliesDocument>()
  readonly query = signal('')
  readonly seriesSkuCount = computed(() =>
    this.vmSeriesDirectory().families.reduce((total, series) => total + series.skuCount, 0)
  )
  readonly filteredSeries = computed(() => {
    const tokens = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean)
    return [...this.vmSeriesDirectory().families]
      .filter((series) => {
        const searchable = [
          series.series,
          series.familyGroup ?? '',
          series.family,
          series.singletonSku ?? '',
        ]
          .join(' ')
          .toLowerCase()
        return tokens.every((token) => searchable.includes(token))
      })
      .sort((left, right) => VM_NAME_COLLATOR.compare(left.series, right.series))
  })
  readonly resultSummary = computed(
    () =>
      `${VM_NUMBER_FORMATTER.format(this.filteredSeries().length)} of ${VM_NUMBER_FORMATTER.format(this.vmSeriesDirectory().families.length)} VM series`
  )

  ngOnInit(): void {
    const data = this.vmSeriesDirectory()
    const canonicalUrl = 'https://www.azurespeed.com/AzureVmPricing/Series'
    const description = `Browse ${VM_NUMBER_FORMATTER.format(data.counts.familyCount)} Azure VM series across D, E, F, M, N, and other VM families. Compare Linux and Windows pay-as-you-go, reserved, and Spot prices, specifications, and pricing coverage by VM size.`
    this.seoService.setPageMeta({
      title: 'Azure VM Series: Sizes, Prices and Specifications',
      description,
      canonicalUrl,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Azure VM Sizes & Pricing',
              item: 'https://www.azurespeed.com/AzureVmPricing',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Series',
              item: canonicalUrl,
            },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Azure VM series',
          numberOfItems: data.families.length,
          itemListElement: data.families.map((series, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: series.series,
            url: canonicalUrlForSeries(series),
          })),
        },
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

function canonicalUrlForSeries(series: VmFamilySummary): string {
  const path = series.singletonSku
    ? buildVmSkuHref(series.singletonSku)
    : buildVmSeriesHref(series.series)
  return `https://www.azurespeed.com${path}`
}
