import { Component, computed, inject, input, OnInit, signal } from '@angular/core'

import {
  AI_MODEL_COMPARISON_HREF,
  AI_MODEL_COMPARISON_LIMIT,
  AI_MODEL_PRICE_CLOUD_LABEL,
  AI_MODEL_PRICING_HREF,
  AI_MODEL_PRICING_OFFICIAL_SOURCES,
  AiModelPriceRange,
  AiModelPriceSummary,
  AiModelPricingCatalog,
  AiModelPricingEntry,
  aiModelRegionIsPublic,
  DEFAULT_AI_MODEL_PROFILE,
  getAiModelPricingProfileGuide,
  summarizeAiModelPricing,
} from '../../../services/ai-model-pricing'
import { SeoService } from '../../../services/seo.service'
import { buildDocumentHref } from '../../../shared/document-navigation'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { buildSearchPhrases, matchesSearchPhrases } from '../../../shared/search-normalization'
import {
  absoluteUrl,
  buildBreadcrumbList,
  buildDataset,
  buildFaqPage,
  buildItemList,
} from '../../../shared/structured-data'

type PriceCoverage = '' | 'cache-write' | 'cached-input' | 'input-output'
type SortDirection = 'asc' | 'desc'
type SortKey = 'cacheWrite' | 'cachedInput' | 'input' | 'name' | 'output' | 'provider'

interface AiModelListView {
  readonly model: AiModelPricingEntry
  readonly summary: AiModelPriceSummary
}

interface AiModelPricingFaq {
  readonly answer: string
  readonly question: string
}

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')
const NAME_COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
const STRUCTURED_DATA_ITEM_LIMIT = 50
const AI_MODEL_PRICING_SOURCE_FAQ: AiModelPricingFaq = {
  question: 'Where do the prices on this page come from?',
  answer:
    'Prices come from the Azure Retail Prices API. This directory groups comparable Microsoft Foundry consumption prices by deployment profile and presents token prices in USD per 1 million tokens.',
}
const AI_MODEL_PRICING_FAQS: readonly AiModelPricingFaq[] = [
  {
    question: 'Does this directory include every model in Microsoft Foundry?',
    answer:
      'No. The official Foundry catalog includes models with many hosting and billing arrangements. This directory covers the subset with comparable consumption token meters published by the Azure Retail Prices API.',
  },
  {
    question: 'What is the difference between Global, Data Zone, and Regional pricing?',
    answer:
      'Global deployments may process inference data in any Azure region. Data Zone deployments keep processing within a Microsoft-specified US, EU, or APAC data zone. Regional deployments process inference data in the deployment region.',
  },
  {
    question: 'Does this directory include provisioned throughput pricing?',
    answer:
      'No. Provisioned deployments reserve capacity and are billed with provisioned throughput units, or PTUs. This directory compares consumption token meters such as Standard, Batch, and Priority instead.',
  },
  {
    question: 'Are these the exact prices that appear on an Azure invoice?',
    answer:
      'They are public Microsoft retail prices in USD, not account-specific quotes. Enterprise agreements, negotiated discounts, taxes, currencies, and the purchase date can change the amount billed.',
  },
  {
    question: 'Why can a value differ from the public Azure OpenAI pricing table?',
    answer:
      'The public pricing page can round displayed values and shows a selected region. This directory preserves Azure Retail Prices API precision and can show a range when multiple matching price regions publish different values.',
  },
  {
    question: 'Does a published price guarantee that a model can be deployed?',
    answer:
      'No. Price publication is separate from model availability, regional support, quota, capacity, and subscription eligibility. Confirm deployment support in the official Foundry model catalog and region documentation.',
  },
]
const DEFAULT_SORT_DIRECTIONS: Readonly<Record<SortKey, SortDirection>> = {
  cacheWrite: 'asc',
  cachedInput: 'asc',
  input: 'asc',
  name: 'asc',
  output: 'asc',
  provider: 'asc',
}

function compareStrings(left: string, right: string, direction: SortDirection): number {
  const comparison = NAME_COLLATOR.compare(left, right)
  return direction === 'asc' ? comparison : -comparison
}

function compareNumbers(left: number, right: number, direction: SortDirection): number {
  return direction === 'asc' ? left - right : right - left
}

function compareNullableNumbers(
  left: number | null,
  right: number | null,
  direction: SortDirection
): number {
  if (left === null && right === null) return 0
  if (left === null) return 1
  if (right === null) return -1
  return compareNumbers(left, right, direction)
}

@Component({
  selector: 'app-azure-ai-model-price-list',
  imports: [LucideIconComponent],
  templateUrl: './azure-ai-model-price-list.html',
  styleUrl: './azure-ai-model-price-list.css',
  host: { class: 'block max-w-full min-w-0 overflow-x-hidden' },
})
export class AzureAiModelPriceList implements OnInit {
  readonly buildDocumentHref = buildDocumentHref
  private readonly seoService = inject(SeoService)

  readonly aiModelPricingCatalog = input.required<AiModelPricingCatalog>()
  readonly comparisonHref = AI_MODEL_COMPARISON_HREF
  readonly comparisonLimit = AI_MODEL_COMPARISON_LIMIT
  readonly priceCloudLabel = AI_MODEL_PRICE_CLOUD_LABEL
  readonly officialSources = AI_MODEL_PRICING_OFFICIAL_SOURCES
  readonly pricingSourceFaq = AI_MODEL_PRICING_SOURCE_FAQ
  readonly pricingFaqs = AI_MODEL_PRICING_FAQS
  readonly query = signal('')
  readonly selectedProvider = signal('')
  readonly selectedProfile = signal(DEFAULT_AI_MODEL_PROFILE)
  readonly selectedRegion = signal('')
  readonly selectedCoverage = signal<PriceCoverage>('')
  readonly selectedSort = signal<SortKey>('name')
  readonly sortDirection = signal<SortDirection>('asc')
  readonly selectedModelIds = signal<readonly string[]>([])

  readonly catalog = computed(() => this.aiModelPricingCatalog())
  readonly regionOptions = computed(() =>
    this.catalog().filters.regions.filter((region) => aiModelRegionIsPublic(region.value))
  )
  readonly selectedRegionLabel = computed(() => {
    const selectedRegion = this.selectedRegion()
    if (!selectedRegion) return `All ${AI_MODEL_PRICE_CLOUD_LABEL} price regions`
    const regionLabel =
      this.catalog().filters.regions.find((region) => region.value === selectedRegion)?.label ??
      selectedRegion
    return `${AI_MODEL_PRICE_CLOUD_LABEL} - ${regionLabel}`
  })
  readonly selectedProfileGuide = computed(() =>
    getAiModelPricingProfileGuide(this.selectedProfile())
  )
  readonly selectedModels = computed(() => {
    const modelsById = new Map(this.catalog().models.map((model) => [model.id, model]))
    return this.selectedModelIds()
      .map((modelId) => modelsById.get(modelId))
      .filter((model): model is AiModelPricingEntry => model !== undefined)
  })
  readonly comparisonReady = computed(() => this.selectedModelIds().length >= 2)
  readonly comparisonFull = computed(
    () => this.selectedModelIds().length >= AI_MODEL_COMPARISON_LIMIT
  )
  readonly comparisonQueryParams = computed(() => ({
    models: this.selectedModelIds().length ? this.selectedModelIds().join(',') : null,
    profile: this.selectedProfile(),
    region: this.selectedRegion() || null,
  }))

  readonly filteredModels = computed(() => {
    const searchPhrases = buildSearchPhrases(this.query())
    const provider = this.selectedProvider()
    const profile = this.selectedProfile()
    const region = this.selectedRegion()
    const coverage = this.selectedCoverage()
    const sort = this.selectedSort()
    const direction = this.sortDirection()

    const views = this.catalog()
      .models.map((model): AiModelListView | null => {
        const summary = summarizeAiModelPricing(model, profile, region)
        return summary ? { model, summary } : null
      })
      .filter((view): view is AiModelListView => view !== null)
      .filter((view) => {
        if (provider && view.model.provider !== provider) return false
        if (!matchesSearchPhrases(view.model.searchText, searchPhrases)) {
          return false
        }
        switch (coverage) {
          case 'input-output':
            return view.summary.input !== null && view.summary.output !== null
          case 'cached-input':
            return view.summary.cachedInput !== null
          case 'cache-write':
            return view.summary.cacheWrite !== null
          default:
            return true
        }
      })

    return [...views].sort((left, right) => {
      switch (sort) {
        case 'provider':
          return (
            compareStrings(left.model.provider, right.model.provider, direction) ||
            NAME_COLLATOR.compare(left.model.name, right.model.name)
          )
        case 'input':
          return (
            compareNullableNumbers(
              left.summary.input?.min ?? null,
              right.summary.input?.min ?? null,
              direction
            ) || NAME_COLLATOR.compare(left.model.name, right.model.name)
          )
        case 'cachedInput':
          return (
            compareNullableNumbers(
              left.summary.cachedInput?.min ?? null,
              right.summary.cachedInput?.min ?? null,
              direction
            ) || NAME_COLLATOR.compare(left.model.name, right.model.name)
          )
        case 'cacheWrite':
          return (
            compareNullableNumbers(
              left.summary.cacheWrite?.min ?? null,
              right.summary.cacheWrite?.min ?? null,
              direction
            ) || NAME_COLLATOR.compare(left.model.name, right.model.name)
          )
        case 'output':
          return (
            compareNullableNumbers(
              left.summary.output?.min ?? null,
              right.summary.output?.min ?? null,
              direction
            ) || NAME_COLLATOR.compare(left.model.name, right.model.name)
          )
        default:
          return compareStrings(left.model.name, right.model.name, direction)
      }
    })
  })

  readonly resultSummary = computed(
    () =>
      `${NUMBER_FORMATTER.format(this.filteredModels().length)} matching models ` +
      `(${NUMBER_FORMATTER.format(this.catalog().counts.modelCount)} total)`
  )
  readonly hasActiveFilters = computed(() =>
    Boolean(
      this.query().trim() ||
      this.selectedProvider() ||
      this.selectedRegion() ||
      this.selectedCoverage() ||
      this.selectedProfile() !== DEFAULT_AI_MODEL_PROFILE
    )
  )
  private readonly priceFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.catalog().currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })
  )

  ngOnInit(): void {
    const catalog = this.catalog()
    this.seoService.setPageMeta({
      title: 'Azure AI Model Pricing & Token Cost Comparison',
      description:
        'Browse and compare Microsoft Foundry and Azure OpenAI token prices for Azure Public by provider, deployment profile, price region, input, cached input, output, and cache write pricing.',
      canonicalUrl: absoluteUrl(AI_MODEL_PRICING_HREF),
      structuredData: [
        buildBreadcrumbList([
          { name: 'Azure resources', path: '/Information/AzureRegions' },
          { name: 'Azure AI Model Pricing', path: AI_MODEL_PRICING_HREF },
        ]),
        buildDataset({
          name: 'Azure AI Model Pricing',
          description:
            'Microsoft Foundry consumption token pricing normalized to US dollars per one million tokens.',
          url: absoluteUrl(AI_MODEL_PRICING_HREF),
          isBasedOn: AI_MODEL_PRICING_OFFICIAL_SOURCES.map((source) => source.href),
          measurementTechnique: 'Azure Retail Prices API',
          variableMeasured: [
            'Input token price',
            'Output token price',
            'Cached input token price',
            'Cache write token price',
            'Deployment pricing profile',
            'Azure Public price region',
          ],
        }),
        buildItemList({
          name: 'Azure AI models with token pricing',
          numberOfItems: catalog.counts.modelCount,
          entries: catalog.models
            .slice(0, STRUCTURED_DATA_ITEM_LIMIT)
            .map((model) => ({ name: model.name })),
        }),
        buildFaqPage([AI_MODEL_PRICING_SOURCE_FAQ, ...AI_MODEL_PRICING_FAQS]),
      ],
    })
  }

  updateQuery(value: string): void {
    this.query.set(value.slice(0, 160))
  }

  updateProvider(value: string): void {
    this.selectedProvider.set(value)
  }

  updateProfile(value: string): void {
    this.selectedProfile.set(value)
  }

  updateRegion(value: string): void {
    this.selectedRegion.set(value)
  }

  updateCoverage(value: string): void {
    if (['', 'cache-write', 'cached-input', 'input-output'].includes(value)) {
      this.selectedCoverage.set(value as PriceCoverage)
    }
  }

  sortBy(sortKey: SortKey): void {
    const nextDirection =
      this.selectedSort() === sortKey
        ? this.sortDirection() === 'asc'
          ? 'desc'
          : 'asc'
        : DEFAULT_SORT_DIRECTIONS[sortKey]
    this.selectedSort.set(sortKey)
    this.sortDirection.set(nextDirection)
  }

  sortAriaValue(sortKey: SortKey): 'ascending' | 'descending' | null {
    if (this.selectedSort() !== sortKey) return null
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending'
  }

  isSortedBy(sortKey: SortKey): boolean {
    return this.selectedSort() === sortKey
  }

  isSortAscending(): boolean {
    return this.sortDirection() === 'asc'
  }

  clearFilters(): void {
    this.query.set('')
    this.selectedProvider.set('')
    this.selectedProfile.set(DEFAULT_AI_MODEL_PROFILE)
    this.selectedRegion.set('')
    this.selectedCoverage.set('')
  }

  toggleModel(modelId: string, selected: boolean): void {
    const current = this.selectedModelIds()
    if (!selected) {
      this.selectedModelIds.set(current.filter((selectedId) => selectedId !== modelId))
    } else if (!current.includes(modelId) && current.length < AI_MODEL_COMPARISON_LIMIT) {
      this.selectedModelIds.set([...current, modelId])
    }
  }

  removeSelectedModel(modelId: string): void {
    this.toggleModel(modelId, false)
  }

  clearComparisonSelection(): void {
    this.selectedModelIds.set([])
  }

  isModelSelected(modelId: string): boolean {
    return this.selectedModelIds().includes(modelId)
  }

  formatPrice(range: AiModelPriceRange | null): string {
    if (!range) return 'N/A'
    const minimum = this.priceFormatter().format(range.min)
    return range.min === range.max
      ? minimum
      : `${minimum} - ${this.priceFormatter().format(range.max)}`
  }
}
