import { CdkScrollable } from '@angular/cdk/scrolling'
import { Component, computed, effect, inject, input } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'

import { SeoService } from '../../../services/seo.service'
import {
  buildVmRegionHref,
  buildVmSeriesHref,
  buildVmSkuHref,
  VM_COMPARISON_HREF,
  VmComparisonDocument,
  VmOperatingSystem,
  VmPriceMode,
  vmPriceModeLabel,
  vmPriceProfileSourceLabel,
  vmRegionHourlyPrice,
  VmSkuDetailDocument,
  VmSkuDirectoryEntry,
} from '../../../services/vm-catalog'
import {
  buildVmSkuCpuDetails,
  buildVmSkuSpecs,
  buildVmSkuStoragePerformance,
  formatVmBytesPerSecond,
  formatVmHourlyPrice,
  formatVmMonthlyPrice,
  formatVmNumber,
  VM_NAME_COLLATOR,
  VmSkuCpuDetails,
  VmSkuSpecs,
  VmSkuStoragePerformance,
} from '../../../services/vm-catalog-view'
import {
  ComparisonPicker,
  ComparisonPickerOption,
} from '../../../shared/comparison-picker/comparison-picker'
import { ComparisonViewToolbar } from '../../../shared/comparison-view-toolbar/comparison-view-toolbar'
import { ExportCsvButtonComponent } from '../../../shared/export-csv-button/export-csv-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { absoluteUrl, buildBreadcrumbList, buildSchemaNode } from '../../../shared/structured-data'
import { VmCatalogNotice } from '../vm-catalog-notice/vm-catalog-notice'
import { VmOperatingSystemToggle } from '../vm-operating-system-toggle/vm-operating-system-toggle'
import { VmPriceModeToggle } from '../vm-price-mode-toggle/vm-price-mode-toggle'

interface VmComparisonRegionOption {
  readonly armRegionName: string
  readonly displayName: string
}

interface VmComparisonColumn {
  readonly detail: VmSkuDetailDocument
  readonly cpuDetails: VmSkuCpuDetails
  readonly specs: VmSkuSpecs
  readonly storagePerformance: VmSkuStoragePerformance
  readonly hourlyPrice: number | null
  readonly priceDifferencePercent: number | null
  readonly priceRegionLabel: string
  readonly pricedRegionCount: number
  readonly memoryPerVcpu: number | null
  readonly isLowestPrice: boolean
}

interface VmComparisonMobileRow {
  readonly key: VmComparisonRowKey
  readonly label: string
  readonly value: string
  readonly emphasized?: boolean
  readonly lowestPrice?: boolean
}

interface VmComparisonMobileGroup {
  readonly key: VmComparisonGroupKey
  readonly label: string
  readonly rows: readonly VmComparisonMobileRow[]
}

const MAX_COMPARISON_SKUS = 3
const MIN_COMPARISON_SKUS = 2
type VmComparisonGroupKey = 'compute' | 'identity' | 'pricing' | 'storage'
type VmComparisonRowKey =
  | 'acceleratedNetworking'
  | 'architecture'
  | 'constrainedVcpus'
  | 'diskControllerTypes'
  | 'gpus'
  | 'hourlyPrice'
  | 'maxDataDisks'
  | 'maxNetworkInterfaces'
  | 'memory'
  | 'memoryPerVcpu'
  | 'monthlyPrice'
  | 'observedRegions'
  | 'premiumIO'
  | 'priceDifference'
  | 'pricedRegions'
  | 'priceRegion'
  | 'rdma'
  | 'series'
  | 'uncachedDiskIops'
  | 'uncachedDiskThroughput'
  | 'vcpus'

const VM_COMPARISON_GROUP_ROWS: Readonly<
  Record<VmComparisonGroupKey, readonly VmComparisonRowKey[]>
> = {
  identity: ['series'],
  pricing: ['hourlyPrice', 'monthlyPrice', 'priceDifference', 'priceRegion', 'pricedRegions'],
  compute: ['vcpus', 'constrainedVcpus', 'memory', 'memoryPerVcpu', 'architecture', 'gpus'],
  storage: [
    'maxDataDisks',
    'diskControllerTypes',
    'uncachedDiskIops',
    'uncachedDiskThroughput',
    'maxNetworkInterfaces',
    'premiumIO',
    'acceleratedNetworking',
    'rdma',
    'observedRegions',
  ],
}
const VM_COMPARISON_ROWS = Object.values(VM_COMPARISON_GROUP_ROWS).flat()

function toVmPickerOption(sku: VmSkuDirectoryEntry): ComparisonPickerOption {
  const { memoryGB, vcpus } = sku.specs
  const description = [
    sku.series,
    vcpus ? `${vcpus} vCPU` : null,
    memoryGB ? `${memoryGB} GB` : null,
  ]
    .filter((value): value is string => value !== null)
    .join(' - ')
  return {
    value: sku.sku,
    label: sku.sku,
    description,
    searchText: [
      sku.family,
      sku.familyGroup ?? '',
      sku.series,
      sku.size,
      sku.specs.architecture ?? '',
      vcpus ? `${vcpus} vcpu vcpus cores` : '',
      memoryGB ? `${memoryGB} gb memory ram` : '',
      // Only emit a keyword when the capability is present, so a search for "rdma" matches the
      // RDMA-capable sizes instead of every row.
      sku.specs.gpuCount ? `${sku.specs.gpuCount} gpu gpus` : '',
      sku.specs.premiumIO ? 'premium storage premium io' : '',
      sku.specs.acceleratedNetworking ? 'accelerated networking' : '',
      sku.specs.rdma ? 'rdma' : '',
    ].join(' '),
  }
}

function displayValuesDiffer(values: readonly string[]): boolean {
  const [firstValue, ...remainingValues] = values
  return remainingValues.some((value) => value !== firstValue)
}

@Component({
  selector: 'app-azure-vm-comparison',
  imports: [
    CdkScrollable,
    ComparisonPicker,
    ComparisonViewToolbar,
    ExportCsvButtonComponent,
    LucideIconComponent,
    VmCatalogNotice,
    VmOperatingSystemToggle,
    VmPriceModeToggle,
  ],
  templateUrl: './azure-vm-comparison.html',
  styleUrl: './azure-vm-comparison.css',
  host: { class: 'block max-w-full min-w-0 overflow-x-hidden' },
})
export class AzureVmComparison {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly seoService = inject(SeoService)

  readonly vmComparisonPageData = input.required<VmComparisonDocument>()
  readonly totalComparisonRowCount = VM_COMPARISON_ROWS.length
  readonly csvFilename = 'azure-vm-comparison'

  readonly selectedOperatingSystem = computed(
    () => this.vmComparisonPageData().selectedOperatingSystem
  )
  readonly selectedPriceMode = computed(() => this.vmComparisonPageData().selectedPriceMode)
  readonly showDifferencesOnly = computed(() => this.vmComparisonPageData().showDifferencesOnly)
  readonly selectedPriceModeLabel = computed(() => vmPriceModeLabel(this.selectedPriceMode()))
  readonly selectedPriceSourceLabel = computed(() =>
    vmPriceProfileSourceLabel(
      this.vmComparisonPageData().catalog.source,
      this.selectedOperatingSystem(),
      this.selectedPriceMode()
    )
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
  readonly sortedSkuPickerOptions = computed(() =>
    [...this.vmComparisonPageData().catalog.skus]
      .sort((left, right) => VM_NAME_COLLATOR.compare(left.sku, right.sku))
      .map(toVmPickerOption)
  )
  readonly availableSkuPickerOptions = computed(() =>
    this.sortedSkuPickerOptions().filter(
      (option) => !this.selectedSkuKeys().has(option.value.toLowerCase())
    )
  )
  readonly replacementSkuPickerOptions = computed(() => {
    const selectedSkuKeys = this.selectedSkuKeys()
    const sortedOptions = this.sortedSkuPickerOptions()
    return new Map(
      this.selectedSkuNames().map((selectedSkuName) => [
        selectedSkuName.toLowerCase(),
        sortedOptions.filter(
          (option) =>
            option.value.toLowerCase() === selectedSkuName.toLowerCase() ||
            !selectedSkuKeys.has(option.value.toLowerCase())
        ),
      ])
    )
  })
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
        cpuDetails: buildVmSkuCpuDetails(detail.sku),
        specs,
        storagePerformance: buildVmSkuStoragePerformance(detail.sku),
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
  readonly mobileCards = computed(() =>
    this.columns().map((column) => ({
      column,
      groups: [
        {
          key: 'pricing',
          label: `${this.selectedOperatingSystem()} ${this.selectedPriceModeLabel()} pricing`,
          rows: [
            {
              key: 'hourlyPrice',
              label: 'Hourly price',
              value: this.formatHourlyPrice(column.hourlyPrice),
              emphasized: true,
              lowestPrice: column.isLowestPrice,
            },
            {
              key: 'monthlyPrice',
              label: 'Estimated monthly',
              value: this.formatMonthlyPrice(column.hourlyPrice),
              emphasized: true,
            },
            {
              key: 'priceDifference',
              label: 'Difference vs. lowest',
              value: this.priceDifferenceLabel(column),
            },
            { key: 'priceRegion', label: 'Price region', value: column.priceRegionLabel },
            {
              key: 'pricedRegions',
              label: 'Priced regions',
              value: String(column.pricedRegionCount),
            },
          ],
        },
        {
          key: 'compute',
          label: 'Compute and memory',
          rows: [
            {
              key: 'vcpus',
              label: 'vCPUs',
              value: formatVmNumber(column.specs.vcpus),
              emphasized: true,
            },
            {
              key: 'constrainedVcpus',
              label: 'Constrained vCPU',
              value: this.formatVcpuConstraint(column.cpuDetails),
            },
            {
              key: 'memory',
              label: 'Memory',
              value: this.formatMemory(column.specs.memoryGB),
              emphasized: true,
            },
            {
              key: 'memoryPerVcpu',
              label: 'Memory per vCPU',
              value: this.formatMemoryPerVcpu(column.memoryPerVcpu),
            },
            {
              key: 'architecture',
              label: 'CPU architecture',
              value: column.specs.architecture ?? 'N/A',
            },
            { key: 'gpus', label: 'GPUs', value: formatVmNumber(column.specs.gpuCount) },
          ],
        },
        {
          key: 'storage',
          label: 'Storage and networking',
          rows: [
            {
              key: 'maxDataDisks',
              label: 'Maximum data disks',
              value: formatVmNumber(column.specs.maxDataDisks),
            },
            {
              key: 'diskControllerTypes',
              label: 'Disk controllers',
              value: column.storagePerformance.diskControllerTypes ?? 'N/A',
            },
            {
              key: 'uncachedDiskIops',
              label: 'Uncached disk IOPS',
              value: formatVmNumber(column.storagePerformance.uncachedDiskIops),
            },
            {
              key: 'uncachedDiskThroughput',
              label: 'Uncached disk throughput',
              value: formatVmBytesPerSecond(column.storagePerformance.uncachedDiskBytesPerSecond),
            },
            {
              key: 'maxNetworkInterfaces',
              label: 'Maximum network interfaces',
              value: formatVmNumber(column.specs.maxNetworkInterfaces),
            },
            {
              key: 'premiumIO',
              label: 'Premium storage',
              value: this.formatBoolean(column.specs.premiumIO),
            },
            {
              key: 'acceleratedNetworking',
              label: 'Accelerated networking',
              value: this.formatBoolean(column.specs.acceleratedNetworking),
            },
            { key: 'rdma', label: 'RDMA', value: this.formatBoolean(column.specs.rdma) },
            {
              key: 'observedRegions',
              label: 'Observed regions',
              value: String(column.detail.sku.observedLocations.length),
            },
          ],
        },
        {
          key: 'identity',
          label: 'Identity',
          rows: [{ key: 'series', label: 'Series', value: column.detail.sku.series }],
        },
      ] as readonly VmComparisonMobileGroup[],
    }))
  )
  readonly comparisonRowValues = computed<ReadonlyMap<VmComparisonRowKey, readonly string[]>>(
    () => {
      const values = new Map<VmComparisonRowKey, string[]>()
      for (const card of this.mobileCards()) {
        for (const group of card.groups) {
          for (const row of group.rows) {
            const rowValues = values.get(row.key) ?? []
            rowValues.push(row.value)
            values.set(row.key, rowValues)
          }
        }
      }
      return values
    }
  )
  readonly differingRows = computed<ReadonlySet<VmComparisonRowKey>>(() => {
    const rowValues = this.comparisonRowValues()
    return new Set(
      VM_COMPARISON_ROWS.filter((row) => displayValuesDiffer(rowValues.get(row) ?? []))
    )
  })
  readonly uniformlyUnavailableRows = computed(
    () =>
      VM_COMPARISON_ROWS.filter((row) => {
        const values = this.comparisonRowValues().get(row) ?? []
        return values.length > 0 && values.every((value) => value === 'N/A')
      }).length
  )
  readonly visibleComparisonRowCount = computed(() =>
    this.showDifferencesOnly() ? this.differingRows().size : VM_COMPARISON_ROWS.length
  )
  readonly csvHeaders = computed<string[]>(() => ['Attribute', ...this.selectedSkuNames()])
  readonly csvRows = computed<string[][]>(() => {
    const cards = this.mobileCards()
    const firstCard = cards.at(0)
    if (!firstCard) return []
    const repeatForCards = (value: string): string[] => cards.map(() => value)
    const visibleRows = new Set(
      this.showDifferencesOnly() ? [...this.differingRows()] : VM_COMPARISON_ROWS
    )
    const comparisonRows = firstCard.groups.flatMap((group) =>
      group.rows.flatMap((row) => {
        if (!visibleRows.has(row.key)) return []
        const values = cards.map(
          (card) =>
            card.groups
              .flatMap((candidateGroup) => candidateGroup.rows)
              .find((candidateRow) => candidateRow.key === row.key)?.value ?? 'N/A'
        )
        return [[row.label, ...values]]
      })
    )
    return [
      ['Operating system', ...repeatForCards(this.selectedOperatingSystem())],
      ['Pricing model', ...repeatForCards(this.selectedPriceModeLabel())],
      ['Price source', ...repeatForCards(this.selectedPriceSourceLabel())],
      ['Pricing basis', ...repeatForCards(this.pricingBasisLabel())],
      ...comparisonRows,
    ]
  })

  readonly buildVmRegionHref = buildVmRegionHref
  readonly buildVmSeriesHref = buildVmSeriesHref
  readonly buildVmSkuHref = buildVmSkuHref
  readonly formatBytesPerSecond = formatVmBytesPerSecond
  readonly formatNumber = formatVmNumber

  constructor() {
    effect(() => {
      const data = this.vmComparisonPageData()
      const selectedNames = data.skus.map((detail) => detail.sku.sku)
      const description = selectedNames.length
        ? `Compare Azure VM specifications and ${data.selectedOperatingSystem} ${vmPriceModeLabel(data.selectedPriceMode)} prices for ${selectedNames.join(', ')} across a shared region or each VM's lowest-price region.`
        : 'Select two or three Azure VM sizes from any series and compare specifications, PAYG, savings plan, reserved, and Spot prices side by side.'
      this.seoService.setPageMeta({
        title: selectedNames.length
          ? `${selectedNames.length} Azure VM Sizes Compared: Prices and Specs`
          : 'Compare Azure VM Sizes, Prices and Specifications',
        description,
        canonicalUrl: absoluteUrl(VM_COMPARISON_HREF),
        structuredData: [
          buildBreadcrumbList([
            { name: 'Azure VM Sizes & Pricing', path: '/AzureVmPricing' },
            { name: 'Compare VM sizes', path: VM_COMPARISON_HREF },
          ]),
          buildSchemaNode('WebApplication', {
            name: 'Azure VM size comparison',
            description,
            url: absoluteUrl(VM_COMPARISON_HREF),
            applicationCategory: 'BusinessApplication',
          }),
        ],
      })
    })
  }

  addSku(skuName: string): void {
    if (!skuName || !this.canAddSku() || this.selectedSkuKeys().has(skuName.toLowerCase())) return
    this.navigateToSelection([...this.selectedSkuNames(), skuName], '')
  }

  replaceSku(currentSkuName: string, replacementSkuName: string): void {
    if (!replacementSkuName || replacementSkuName === currentSkuName) return
    this.navigateToSelection(
      this.selectedSkuNames().map((skuName) =>
        skuName === currentSkuName ? replacementSkuName : skuName
      ),
      ''
    )
  }

  skuOptionsFor(skuName: string): readonly ComparisonPickerOption[] {
    return this.replacementSkuPickerOptions().get(skuName.toLowerCase()) ?? []
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

  updateShowDifferencesOnly(showDifferencesOnly: boolean): void {
    this.navigateToSelection(
      this.selectedSkuNames(),
      this.selectedRegion(),
      this.selectedOperatingSystem(),
      this.selectedPriceMode(),
      showDifferencesOnly
    )
  }

  shouldShowRow(row: VmComparisonRowKey): boolean {
    return !this.showDifferencesOnly() || this.differingRows().has(row)
  }

  shouldShowGroup(group: VmComparisonGroupKey): boolean {
    return (
      !this.showDifferencesOnly() ||
      VM_COMPARISON_GROUP_ROWS[group].some((row) => this.differingRows().has(row))
    )
  }

  formatHourlyPrice(value: number | null): string {
    return formatVmHourlyPrice(
      value,
      this.vmComparisonPageData().catalog.source.retailPrices.currencyCode
    )
  }

  formatMonthlyPrice(value: number | null): string {
    return formatVmMonthlyPrice(
      value,
      this.vmComparisonPageData().catalog.source.retailPrices.currencyCode
    )
  }

  formatMemory(value: number | null): string {
    return value === null ? 'N/A' : `${formatVmNumber(value)} GB`
  }

  formatMemoryPerVcpu(value: number | null): string {
    return value === null ? 'N/A' : `${formatVmNumber(value)} GB/vCPU`
  }

  formatVcpuConstraint(details: VmSkuCpuDetails): string {
    return details.isConstrained
      ? `Yes, ${formatVmNumber(details.availableVcpus)} of ${formatVmNumber(details.baseVcpus)} available`
      : 'No'
  }

  formatBoolean(value: boolean): string {
    return value ? 'Yes' : 'No'
  }

  priceDifferenceLabel(column: VmComparisonColumn): string {
    if (column.hourlyPrice === null || column.priceDifferencePercent === null) {
      return 'N/A'
    }
    return column.isLowestPrice ? 'Lowest selected price' : `+${column.priceDifferencePercent}%`
  }

  private cheapestRegionLabel(
    detail: VmSkuDetailDocument,
    cheapestLocations: readonly string[]
  ): string {
    const [firstRegionName] = cheapestLocations
    if (!firstRegionName) return 'N/A'
    const regionalPrice = detail.prices.find((price) => price.armRegionName === firstRegionName)
    const label = regionalPrice?.region.displayName ?? firstRegionName
    const tiedCount = cheapestLocations.length - 1
    return tiedCount > 0 ? `${label} +${tiedCount}` : label
  }

  private navigateToSelection(
    skuNames: readonly string[],
    regionName: string,
    operatingSystem = this.selectedOperatingSystem(),
    priceMode = this.selectedPriceMode(),
    showDifferencesOnly = this.showDifferencesOnly()
  ): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        skus: skuNames.length ? skuNames.join(',') : null,
        os: operatingSystem,
        mode: priceMode,
        region: regionName || null,
        diff: showDifferencesOnly ? '1' : null,
      },
    })
  }
}
