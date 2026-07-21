import { Component, computed, effect, inject, input, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmRegionHref,
  buildVmSeriesHref,
  buildVmSkuHref,
  VM_COMPARISON_HREF,
  VmComparisonDocument,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeDescription,
  vmPriceModeLabel,
  vmRegionHourlyPrice,
  VmSkuDetailDocument,
} from '../../../services/vm-catalog'
import {
  buildVmSkuSpecs,
  formatVmNumber,
  VM_NAME_COLLATOR,
  VmSkuSpecs,
} from '../../../services/vm-catalog-view'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { VmOperatingSystemToggle } from '../vm-operating-system-toggle/vm-operating-system-toggle'
import { VmPriceModeToggle } from '../vm-price-mode-toggle/vm-price-mode-toggle'

interface VmComparisonRegionOption {
  readonly armRegionName: string
  readonly displayName: string
}

interface VmComparisonColumn {
  readonly detail: VmSkuDetailDocument
  readonly specs: VmSkuSpecs
  readonly hourlyPrice: number | null
  readonly priceDifferencePercent: number | null
  readonly priceRegionLabel: string
  readonly pricedRegionCount: number
  readonly memoryPerVcpu: number | null
  readonly isLowestPrice: boolean
}

const MAX_COMPARISON_SKUS = 3
const MIN_COMPARISON_SKUS = 2
const MONTHLY_HOURS = 730

@Component({
  selector: 'app-azure-vm-comparison',
  imports: [LucideIconComponent, RouterLink, VmOperatingSystemToggle, VmPriceModeToggle],
  templateUrl: './azure-vm-comparison.html',
  styleUrl: './azure-vm-comparison.css',
  host: { class: 'block' },
})
export class AzureVmComparison {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly seoService = inject(SeoService)

  readonly vmComparisonPageData = input.required<VmComparisonDocument>()
  readonly skuInput = signal('')
  readonly pickerMessage = signal('')

  readonly selectedOperatingSystem = computed(
    () => this.vmComparisonPageData().selectedOperatingSystem
  )
  readonly selectedPriceMode = computed(() => this.vmComparisonPageData().selectedPriceMode)
  readonly selectedPriceModeLabel = computed(() => vmPriceModeLabel(this.selectedPriceMode()))
  readonly selectedPriceModeDescription = computed(() =>
    vmPriceModeDescription(this.selectedPriceMode())
  )
  readonly selectedSkuNames = computed(() =>
    this.vmComparisonPageData().skus.map((detail) => detail.sku.sku)
  )
  readonly selectedSkuKeys = computed(
    () => new Set(this.selectedSkuNames().map((skuName) => skuName.toLowerCase()))
  )
  readonly comparisonReady = computed(
    () => this.vmComparisonPageData().skus.length >= MIN_COMPARISON_SKUS
  )
  readonly canAddSku = computed(() => this.vmComparisonPageData().skus.length < MAX_COMPARISON_SKUS)
  readonly remainingSlotCount = computed(
    () => MAX_COMPARISON_SKUS - this.vmComparisonPageData().skus.length
  )
  readonly selectionStatus = computed(() => {
    const count = this.vmComparisonPageData().skus.length
    if (count === 0) return 'No VM sizes selected'
    if (count === 1) return '1 VM selected; add 1 or 2 more to compare'
    return `${count} VMs selected for comparison`
  })
  readonly skuOptions = computed(() =>
    this.vmComparisonPageData()
      .catalog.skus.map((sku) => sku.sku)
      .sort((left, right) => VM_NAME_COLLATOR.compare(left, right))
  )
  readonly commonRegions = computed<readonly VmComparisonRegionOption[]>(() => {
    const details = this.vmComparisonPageData().skus
    if (details.length < MIN_COMPARISON_SKUS) return []
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    const [firstDetail, ...remainingDetails] = details
    const commonRegionNames = firstDetail.sku.priceProfiles[operatingSystem][
      priceMode
    ].pricedLocations.filter((regionName) =>
      remainingDetails.every((detail) =>
        detail.sku.priceProfiles[operatingSystem][priceMode].pricedLocations.includes(regionName)
      )
    )
    const regionsByName = new Map(
      this.vmComparisonPageData().regionDirectory.regions.map((region) => [
        region.armRegionName,
        region,
      ])
    )
    return commonRegionNames
      .map((armRegionName) => {
        const region = regionsByName.get(armRegionName)
        return {
          armRegionName,
          displayName: region?.displayName ?? armRegionName,
        }
      })
      .sort(
        (left, right) =>
          VM_NAME_COLLATOR.compare(left.displayName, right.displayName) ||
          VM_NAME_COLLATOR.compare(left.armRegionName, right.armRegionName)
      )
  })
  readonly selectedRegion = computed(() => {
    const requestedRegion = this.vmComparisonPageData().requestedRegion
    return this.commonRegions().some((region) => region.armRegionName === requestedRegion)
      ? requestedRegion
      : ''
  })
  readonly requestedRegionUnavailable = computed(() =>
    Boolean(this.vmComparisonPageData().requestedRegion && !this.selectedRegion())
  )
  readonly selectedRegionDisplayName = computed(() => {
    const selectedRegion = this.selectedRegion()
    return (
      this.commonRegions().find((region) => region.armRegionName === selectedRegion)?.displayName ??
      ''
    )
  })
  readonly pricingBasisLabel = computed(() =>
    this.selectedRegion()
      ? `${this.selectedRegionDisplayName()} (${this.selectedRegion()})`
      : "Each VM's lowest available region"
  )
  readonly columns = computed<readonly VmComparisonColumn[]>(() => {
    const operatingSystem = this.selectedOperatingSystem()
    const priceMode = this.selectedPriceMode()
    const selectedRegion = this.selectedRegion()
    const preliminary = this.vmComparisonPageData().skus.map((detail) => {
      const profile = detail.sku.priceProfiles[operatingSystem][priceMode]
      const regionalPrice = selectedRegion
        ? detail.prices.find((price) => price.armRegionName === selectedRegion)
        : undefined
      const hourlyPrice = selectedRegion
        ? regionalPrice
          ? vmRegionHourlyPrice(regionalPrice, operatingSystem, priceMode)
          : null
        : profile.minHourlyPrice
      const specs = buildVmSkuSpecs(detail.sku)
      return {
        detail,
        specs,
        hourlyPrice,
        priceRegionLabel: selectedRegion
          ? this.selectedRegionDisplayName()
          : this.cheapestRegionLabel(detail, profile.cheapestLocations),
        pricedRegionCount: profile.pricedLocations.length,
        memoryPerVcpu:
          specs.memoryGB !== null && specs.vcpus !== null && specs.vcpus > 0
            ? specs.memoryGB / specs.vcpus
            : null,
      }
    })
    const availablePrices = preliminary.flatMap((column) =>
      column.hourlyPrice === null ? [] : [column.hourlyPrice]
    )
    const lowestPrice = availablePrices.length ? Math.min(...availablePrices) : null
    return preliminary.map((column) => ({
      ...column,
      priceDifferencePercent:
        column.hourlyPrice === null || lowestPrice === null || lowestPrice === 0
          ? null
          : Number((((column.hourlyPrice - lowestPrice) / lowestPrice) * 100).toFixed(1)),
      isLowestPrice: column.hourlyPrice !== null && column.hourlyPrice === lowestPrice,
    }))
  })
  readonly selectedSeriesCount = computed(
    () => new Set(this.vmComparisonPageData().skus.map((detail) => detail.sku.series)).size
  )

  private readonly hourlyPriceFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.vmComparisonPageData().catalog.source.retailPrices.currencyCode,
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      })
  )
  private readonly monthlyPriceFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.vmComparisonPageData().catalog.source.retailPrices.currencyCode,
        maximumFractionDigits: 2,
      })
  )

  readonly buildVmRegionHref = buildVmRegionHref
  readonly buildVmSeriesHref = buildVmSeriesHref
  readonly buildVmSkuHref = buildVmSkuHref
  readonly formatNumber = formatVmNumber

  constructor() {
    effect(() => {
      const data = this.vmComparisonPageData()
      const selectedNames = data.skus.map((detail) => detail.sku.sku)
      const description = selectedNames.length
        ? `Compare Azure VM specifications and ${data.selectedOperatingSystem} ${vmPriceModeLabel(data.selectedPriceMode)} prices for ${selectedNames.join(', ')} across a shared region or each VM's lowest-price region.`
        : 'Select two or three Azure VM sizes from any series and compare specifications, PAYG, reserved, and Spot prices side by side.'
      this.seoService.setPageMeta({
        title: selectedNames.length
          ? `${selectedNames.length} Azure VM Sizes Compared: Prices and Specs`
          : 'Compare Azure VM Sizes, Prices and Specifications',
        description,
        canonicalUrl: `https://www.azurespeed.com${VM_COMPARISON_HREF}`,
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
                name: 'Compare VM sizes',
                item: `https://www.azurespeed.com${VM_COMPARISON_HREF}`,
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Azure VM size comparison',
            description,
            url: `https://www.azurespeed.com${VM_COMPARISON_HREF}`,
            applicationCategory: 'BusinessApplication',
          },
        ],
      })
    })
  }

  updateSkuInput(value: string): void {
    this.skuInput.set(value.slice(0, 160))
    this.pickerMessage.set('')
  }

  addSku(): void {
    if (!this.canAddSku()) {
      this.pickerMessage.set('A comparison can contain at most 3 VM sizes.')
      return
    }
    const requestedName = this.skuInput().trim()
    const candidate = this.vmComparisonPageData().catalog.skus.find(
      (sku) => sku.sku.toLowerCase() === requestedName.toLowerCase()
    )
    if (!candidate) {
      this.pickerMessage.set('Choose an exact VM size from the suggestions.')
      return
    }
    if (this.selectedSkuKeys().has(candidate.sku.toLowerCase())) {
      this.pickerMessage.set(`${candidate.sku} is already selected.`)
      return
    }
    this.skuInput.set('')
    this.pickerMessage.set('')
    this.navigateToSelection([...this.selectedSkuNames(), candidate.sku], '')
  }

  removeSku(skuName: string): void {
    this.navigateToSelection(
      this.selectedSkuNames().filter((selectedSkuName) => selectedSkuName !== skuName),
      ''
    )
  }

  clearComparison(): void {
    this.navigateToSelection([], '')
  }

  updateOperatingSystem(operatingSystem: VmOperatingSystem): void {
    this.navigateToSelection(this.selectedSkuNames(), '', operatingSystem, this.selectedPriceMode())
  }

  updatePriceMode(priceMode: VmPriceMode): void {
    this.navigateToSelection(this.selectedSkuNames(), '', this.selectedOperatingSystem(), priceMode)
  }

  updateRegion(regionName: string): void {
    this.navigateToSelection(this.selectedSkuNames(), regionName)
  }

  formatHourlyPrice(value: number | null): string {
    return value === null ? 'Price unavailable' : this.hourlyPriceFormatter().format(value)
  }

  formatMonthlyPrice(value: number | null): string {
    return value === null
      ? 'Price unavailable'
      : this.monthlyPriceFormatter().format(value * MONTHLY_HOURS)
  }

  formatMemory(value: number | null): string {
    return value === null ? 'Not listed' : `${formatVmNumber(value)} GB`
  }

  formatMemoryPerVcpu(value: number | null): string {
    return value === null ? 'Not listed' : `${formatVmNumber(value)} GB/vCPU`
  }

  formatBoolean(value: boolean): string {
    return value ? 'Yes' : 'No'
  }

  priceDifferenceLabel(column: VmComparisonColumn): string {
    if (column.hourlyPrice === null || column.priceDifferencePercent === null) {
      return 'Not available'
    }
    return column.isLowestPrice ? 'Lowest selected price' : `+${column.priceDifferencePercent}%`
  }

  private cheapestRegionLabel(
    detail: VmSkuDetailDocument,
    cheapestLocations: readonly string[]
  ): string {
    const [firstRegionName] = cheapestLocations
    if (!firstRegionName) return 'Not available'
    const regionalPrice = detail.prices.find((price) => price.armRegionName === firstRegionName)
    const label = regionalPrice?.region.displayName ?? firstRegionName
    const tiedCount = cheapestLocations.length - 1
    return tiedCount > 0 ? `${label} +${tiedCount}` : label
  }

  private navigateToSelection(
    skuNames: readonly string[],
    regionName: string,
    operatingSystem = this.selectedOperatingSystem(),
    priceMode = this.selectedPriceMode()
  ): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        skus: skuNames.length ? skuNames.join(',') : null,
        os: operatingSystem,
        mode: priceMode,
        region: regionName || null,
      },
    })
  }
}
