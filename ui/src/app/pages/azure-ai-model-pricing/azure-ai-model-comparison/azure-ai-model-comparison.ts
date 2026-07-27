import { CdkScrollable } from '@angular/cdk/scrolling'
import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core'
import { form, FormField, max, min, required, validate } from '@angular/forms/signals'
import { ActivatedRoute, Router } from '@angular/router'

import {
  AI_MODEL_COMPARISON_HREF,
  AI_MODEL_COMPARISON_LIMIT,
  AI_MODEL_PRICE_CLOUD_LABEL,
  AI_MODEL_PRICING_HREF,
  AI_MODEL_WORKLOAD_LIMITS,
  AiModelComparisonPageData,
  AiModelCostEstimate,
  AiModelCostRange,
  AiModelPriceRange,
  AiModelPriceSummary,
  AiModelPricingEntry,
  aiModelRegionIsPublic,
  AiModelWorkload,
  DEFAULT_AI_MODEL_WORKLOAD,
  estimateAiModelCost,
  getAiModelBatchProfile,
  getAiModelPricingProfileGuide,
  MICROSOFT_FOUNDRY_DEPLOYMENT_TYPES_HREF,
  summarizeAiModelPricing,
} from '../../../services/ai-model-pricing'
import { SeoService } from '../../../services/seo.service'
import {
  ComparisonPicker,
  ComparisonPickerOption,
} from '../../../shared/comparison-picker/comparison-picker'
import { ComparisonViewToolbar } from '../../../shared/comparison-view-toolbar/comparison-view-toolbar'
import { ExportCsvButtonComponent } from '../../../shared/export-csv-button/export-csv-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { absoluteUrl, buildBreadcrumbList, buildSchemaNode } from '../../../shared/structured-data'

interface AiModelComparisonColumn {
  readonly model: AiModelPricingEntry
  readonly summary: AiModelPriceSummary | null
  readonly scopeHint: string | null
}

interface AiModelCostColumn {
  readonly column: AiModelComparisonColumn
  readonly cost: AiModelCostEstimate | null
  readonly batchCost: AiModelCostEstimate | null
  readonly batchSavingsPercent: number | null
  readonly differencePercent: number | null
  readonly isLowest: boolean
}

interface AiModelComparisonMobileRow {
  readonly key: AiModelComparisonRowKey
  readonly label: string
  readonly value: string
  readonly emphasized?: boolean
}

interface AiModelComparisonMobileGroup {
  readonly key: AiModelComparisonGroupKey
  readonly label: string
  readonly rows: readonly AiModelComparisonMobileRow[]
}

interface AiModelScopeOption {
  readonly coverage: number
  readonly disabled: boolean
  readonly label: string
  readonly value: string
}

interface AiModelScopeRecommendation {
  readonly actionLabel: string
  readonly coverage: number
  readonly profile: string
  readonly region: string
}

interface AiModelNavigationOverrides {
  readonly profile?: string
  readonly region?: string
  readonly showDifferencesOnly?: boolean
  readonly workload?: AiModelWorkload
}

type AiModelComparisonGroupKey = 'identity' | 'pricing'
type AiModelComparisonRowKey =
  | 'cacheWrite'
  | 'cachedInput'
  | 'effectiveDate'
  | 'input'
  | 'output'
  | 'priceRegions'
  | 'productFamily'
  | 'provider'

const NAME_COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
const AI_MODEL_COMPARISON_GROUP_ROWS: Readonly<
  Record<AiModelComparisonGroupKey, readonly AiModelComparisonRowKey[]>
> = {
  identity: ['provider', 'productFamily'],
  pricing: ['input', 'output', 'cachedInput', 'cacheWrite', 'priceRegions', 'effectiveDate'],
}
const AI_MODEL_COMPARISON_ROWS: readonly AiModelComparisonRowKey[] = Object.values(
  AI_MODEL_COMPARISON_GROUP_ROWS
).flat()
const AI_MODEL_PRICE_ROWS = ['input', 'output', 'cachedInput', 'cacheWrite'] as const

function displayValuesDiffer(values: readonly string[]): boolean {
  const [firstValue, ...remainingValues] = values
  return remainingValues.some((value) => value !== firstValue)
}

function toModelPickerOption(model: AiModelPricingEntry): ComparisonPickerOption {
  return {
    value: model.id,
    label: model.name,
    description: model.provider,
    searchText: model.searchText,
  }
}

function modelHasPricing(model: AiModelPricingEntry, profile: string, region: string): boolean {
  return model.pricing.some(
    (pricePoint) =>
      pricePoint.profile === profile &&
      (!region || pricePoint.region === region) &&
      aiModelRegionIsPublic(pricePoint.region)
  )
}

function pricingCoverage(
  models: readonly AiModelPricingEntry[],
  profile: string,
  region: string
): number {
  return models.filter((model) => modelHasPricing(model, profile, region)).length
}

function profileRecommendationRank(profile: string): number {
  const billingRank = profile.includes('Standard') ? 0 : profile.includes('Batch') ? 10 : 20
  const contextRank = profile.includes('Long context') ? 5 : 0
  return billingRank + contextRank
}

function costRangeIsScalar(range: AiModelCostRange): boolean {
  return Math.abs(range.max - range.min) <= Number.EPSILON * Math.max(1, Math.abs(range.max)) * 8
}

function queryNumber(value: number, defaultValue: number): number | null {
  return value === defaultValue ? null : value
}

@Component({
  selector: 'app-azure-ai-model-comparison',
  imports: [
    CdkScrollable,
    ComparisonPicker,
    ComparisonViewToolbar,
    ExportCsvButtonComponent,
    FormField,
    LucideIconComponent,
  ],
  templateUrl: './azure-ai-model-comparison.html',
  styleUrl: './azure-ai-model-comparison.css',
  host: { class: 'block max-w-full min-w-0 overflow-x-hidden' },
})
export class AzureAiModelComparison {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly seoService = inject(SeoService)

  readonly aiModelComparisonPageData = input.required<AiModelComparisonPageData>()
  readonly totalComparisonRowCount = AI_MODEL_COMPARISON_ROWS.length
  readonly pricingHref = AI_MODEL_PRICING_HREF
  readonly deploymentTypesHref = MICROSOFT_FOUNDRY_DEPLOYMENT_TYPES_HREF
  readonly comparisonLimit = AI_MODEL_COMPARISON_LIMIT
  readonly priceCloudLabel = AI_MODEL_PRICE_CLOUD_LABEL
  readonly csvFilename = 'azure-ai-model-comparison'
  readonly selectedModelIds = computed(() =>
    this.aiModelComparisonPageData().models.map((model) => model.id)
  )
  readonly selectedProfile = computed(() => this.aiModelComparisonPageData().selectedProfile)
  readonly selectedRegion = computed(() => this.aiModelComparisonPageData().selectedRegion)
  readonly showDifferencesOnly = computed(
    () => this.aiModelComparisonPageData().showDifferencesOnly
  )
  readonly workloadModel = linkedSignal(() => ({ ...this.aiModelComparisonPageData().workload }))
  readonly workloadForm = form(
    this.workloadModel,
    (path) => {
      required(path.inputTokensPerRequest, { message: 'Enter input tokens per request.' })
      min(path.inputTokensPerRequest, 0, { message: 'Input tokens cannot be negative.' })
      max(path.inputTokensPerRequest, AI_MODEL_WORKLOAD_LIMITS.tokensPerRequest, {
        message: 'Input tokens exceed the supported estimate limit.',
      })
      required(path.outputTokensPerRequest, { message: 'Enter output tokens per request.' })
      min(path.outputTokensPerRequest, 0, { message: 'Output tokens cannot be negative.' })
      max(path.outputTokensPerRequest, AI_MODEL_WORKLOAD_LIMITS.tokensPerRequest, {
        message: 'Output tokens exceed the supported estimate limit.',
      })
      required(path.requestsPerMonth, { message: 'Enter monthly requests.' })
      min(path.requestsPerMonth, 0, { message: 'Monthly requests cannot be negative.' })
      max(path.requestsPerMonth, AI_MODEL_WORKLOAD_LIMITS.requestsPerMonth, {
        message: 'Monthly requests exceed the supported estimate limit.',
      })
      required(path.cachedInputPercent, { message: 'Enter a cached input percentage.' })
      min(path.cachedInputPercent, 0, { message: 'Cached input cannot be negative.' })
      max(path.cachedInputPercent, AI_MODEL_WORKLOAD_LIMITS.percent, {
        message: 'Cached input cannot exceed 100%.',
      })
      required(path.cacheWritePercent, { message: 'Enter a cache write percentage.' })
      min(path.cacheWritePercent, 0, { message: 'Cache write cannot be negative.' })
      max(path.cacheWritePercent, AI_MODEL_WORKLOAD_LIMITS.percent, {
        message: 'Cache write cannot exceed 100%.',
      })
      validate(path.cacheWritePercent, (context) =>
        context.value() + context.valueOf(path.cachedInputPercent) <=
        AI_MODEL_WORKLOAD_LIMITS.percent
          ? undefined
          : {
              kind: 'cacheAllocation',
              message: 'Cached input and cache write percentages must total 100% or less.',
            }
      )
    },
    { name: 'aiModelWorkload' }
  )

  readonly catalog = computed(() => this.aiModelComparisonPageData().catalog)
  readonly sortedCatalogModels = computed(() =>
    [...this.catalog().models].sort(
      (left, right) =>
        NAME_COLLATOR.compare(left.provider, right.provider) ||
        NAME_COLLATOR.compare(left.name, right.name)
    )
  )
  readonly selectedModels = computed(() => {
    const modelsById = new Map(this.catalog().models.map((model) => [model.id, model]))
    return this.selectedModelIds()
      .map((modelId) => modelsById.get(modelId))
      .filter((model): model is AiModelPricingEntry => model !== undefined)
  })
  readonly availableModelOptions = computed(() => {
    const selectedIds = new Set(this.selectedModelIds())
    return this.sortedCatalogModels()
      .filter((model) => !selectedIds.has(model.id))
      .map(toModelPickerOption)
  })
  readonly replacementModelOptions = computed(() => {
    const selectedIds = new Set(this.selectedModelIds())
    const sortedModels = this.sortedCatalogModels()
    return new Map(
      this.selectedModels().map((selectedModel) => [
        selectedModel.id,
        sortedModels
          .filter(
            (candidate) => candidate.id === selectedModel.id || !selectedIds.has(candidate.id)
          )
          .map(toModelPickerOption),
      ])
    )
  })
  readonly columns = computed<readonly AiModelComparisonColumn[]>(() => {
    const profile = this.selectedProfile()
    const region = this.selectedRegion()
    return this.selectedModels().map((model) => {
      const summary = summarizeAiModelPricing(model, profile, region)
      return {
        model,
        summary,
        scopeHint: summary ? null : this.modelScopeHint(model, profile, region),
      }
    })
  })
  readonly comparisonReady = computed(() => this.selectedModels().length >= 2)
  readonly comparisonFull = computed(
    () => this.selectedModels().length >= AI_MODEL_COMPARISON_LIMIT
  )
  readonly profileOptions = computed<readonly AiModelScopeOption[]>(() => {
    const models = this.selectedModels()
    const selectedRegion = this.selectedRegion()
    return this.catalog().filters.profiles.map((profile) => {
      const coverage = pricingCoverage(models, profile, selectedRegion)
      return {
        value: profile,
        label: models.length ? `${profile} (${coverage}/${models.length})` : profile,
        coverage,
        disabled: models.length > 0 && coverage === 0,
      }
    })
  })
  readonly allRegionsCoverage = computed(() =>
    pricingCoverage(this.selectedModels(), this.selectedProfile(), '')
  )
  readonly regionOptions = computed<readonly AiModelScopeOption[]>(() => {
    const models = this.selectedModels()
    const selectedProfile = this.selectedProfile()
    return this.catalog()
      .filters.regions.filter((region) => aiModelRegionIsPublic(region.value))
      .map((region) => {
        const coverage = pricingCoverage(models, selectedProfile, region.value)
        return {
          value: region.value,
          label: models.length
            ? `${region.label ?? region.value} (${coverage}/${models.length})`
            : (region.label ?? region.value),
          coverage,
          disabled: models.length > 0 && coverage === 0,
        }
      })
  })
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
  readonly noPricingForScope = computed(
    () => this.comparisonReady() && this.columns().every((column) => column.summary === null)
  )
  readonly scopeRecommendation = computed<AiModelScopeRecommendation | null>(() => {
    if (!this.noPricingForScope()) return null
    const models = this.selectedModels()
    const currentProfile = this.selectedProfile()
    const candidates = this.catalog()
      .filters.profiles.map((profile) => ({
        profile,
        coverage: pricingCoverage(models, profile, ''),
      }))
      .filter((candidate) => candidate.coverage > 0)
      .sort(
        (left, right) =>
          right.coverage - left.coverage ||
          Number(right.profile === currentProfile) - Number(left.profile === currentProfile) ||
          profileRecommendationRank(left.profile) - profileRecommendationRank(right.profile) ||
          NAME_COLLATOR.compare(left.profile, right.profile)
      )
    const recommendation = candidates.at(0)
    if (!recommendation) return null
    return {
      profile: recommendation.profile,
      region: '',
      coverage: recommendation.coverage,
      actionLabel:
        recommendation.profile === currentProfile
          ? `Use all ${AI_MODEL_PRICE_CLOUD_LABEL} price regions`
          : `Use ${recommendation.profile}`,
    }
  })
  private readonly priceFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.catalog().currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })
  )
  private readonly costFormatter = computed(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.catalog().currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      })
  )
  private readonly percentFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  })
  private readonly dateFormatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  })
  readonly batchProfile = computed(() => getAiModelBatchProfile(this.selectedProfile()))
  readonly costColumns = computed<readonly AiModelCostColumn[]>(() => {
    const columns = this.columns()
    if (this.workloadForm().invalid()) {
      return columns.map((column) => ({
        column,
        cost: null,
        batchCost: null,
        batchSavingsPercent: null,
        differencePercent: null,
        isLowest: false,
      }))
    }

    const profile = this.selectedProfile()
    const region = this.selectedRegion()
    const workload = this.workloadModel()
    const batchProfile = this.batchProfile()
    const estimates = columns.map((column) => ({
      column,
      cost: estimateAiModelCost(column.model, profile, region, workload),
      batchCost: batchProfile
        ? estimateAiModelCost(column.model, batchProfile, region, workload)
        : null,
    }))
    const pricedEstimates = estimates.filter(
      (estimate): estimate is typeof estimate & { readonly cost: AiModelCostEstimate } =>
        estimate.cost !== null
    )
    const canRank =
      pricedEstimates.length >= 2 &&
      pricedEstimates.every((estimate) => costRangeIsScalar(estimate.cost.monthly))
    const lowestCost = canRank
      ? Math.min(...pricedEstimates.map((estimate) => estimate.cost.monthly.min))
      : null

    return estimates.map(({ column, cost, batchCost }) => {
      const isLowest =
        cost !== null &&
        lowestCost !== null &&
        Math.abs(cost.monthly.min - lowestCost) <=
          Number.EPSILON * Math.max(1, Math.abs(lowestCost)) * 8
      const differencePercent =
        cost === null || lowestCost === null || lowestCost === 0
          ? null
          : Number((((cost.monthly.min - lowestCost) / lowestCost) * 100).toFixed(1))
      const batchSavingsPercent =
        cost &&
        batchCost &&
        costRangeIsScalar(cost.monthly) &&
        costRangeIsScalar(batchCost.monthly) &&
        cost.monthly.min > 0
          ? Number(
              (((cost.monthly.min - batchCost.monthly.min) / cost.monthly.min) * 100).toFixed(1)
            )
          : null
      return {
        column,
        cost,
        batchCost,
        batchSavingsPercent,
        differencePercent,
        isLowest,
      }
    })
  })
  readonly costRankingMessage = computed(() => {
    if (this.workloadForm().invalid()) return ''
    const pricedColumns = this.costColumns().filter((column) => column.cost !== null)
    if (pricedColumns.length < 2) {
      return 'At least two selected models need complete input and output prices for this workload.'
    }
    return pricedColumns.some(
      (column) => column.cost !== null && !costRangeIsScalar(column.cost.monthly)
    )
      ? 'Choose one price region to identify a single lowest-cost model.'
      : ''
  })
  readonly workloadValidationMessage = computed(() => {
    const error = [
      ...this.workloadForm.inputTokensPerRequest().errors(),
      ...this.workloadForm.outputTokensPerRequest().errors(),
      ...this.workloadForm.requestsPerMonth().errors(),
      ...this.workloadForm.cachedInputPercent().errors(),
      ...this.workloadForm.cacheWritePercent().errors(),
    ].at(0)
    return error?.message ?? ''
  })
  readonly hasBatchEstimates = computed(() =>
    this.costColumns().some((column) => column.batchCost !== null)
  )
  readonly mobileCards = computed(() =>
    this.columns().map((column) => ({
      column,
      groups: [
        {
          key: 'pricing',
          label: `${this.selectedProfile()} pricing`,
          rows: AI_MODEL_COMPARISON_GROUP_ROWS.pricing.map((key) => ({
            key,
            label: this.comparisonRowLabel(key),
            value: this.comparisonValue(column, key),
            emphasized: key === 'input' || key === 'output',
          })),
        },
        {
          key: 'identity',
          label: 'Identity',
          rows: AI_MODEL_COMPARISON_GROUP_ROWS.identity.map((key) => ({
            key,
            label: this.comparisonRowLabel(key),
            value: this.comparisonValue(column, key),
          })),
        },
      ] as readonly AiModelComparisonMobileGroup[],
    }))
  )
  readonly differingRows = computed<ReadonlySet<AiModelComparisonRowKey>>(() => {
    const columns = this.columns()
    return new Set(
      AI_MODEL_COMPARISON_ROWS.filter((row) =>
        displayValuesDiffer(columns.map((column) => this.comparisonValue(column, row)))
      )
    )
  })
  readonly uniformlyUnavailableRows = computed(
    () =>
      AI_MODEL_PRICE_ROWS.filter((row) =>
        this.columns().every((column) => column.summary?.[row] == null)
      ).length
  )
  readonly visibleComparisonRowCount = computed(() =>
    this.showDifferencesOnly() ? this.differingRows().size : AI_MODEL_COMPARISON_ROWS.length
  )
  readonly csvHeaders = computed<string[]>(() => [
    'Attribute',
    ...this.columns().map((column) => column.model.name),
  ])
  readonly csvRows = computed<string[][]>(() => {
    const columns = this.columns()
    const costColumns = this.costColumns()
    const workload = this.workloadModel()
    const batchProfile = this.batchProfile()
    const rowKeys = this.showDifferencesOnly()
      ? AI_MODEL_COMPARISON_ROWS.filter((row) => this.differingRows().has(row))
      : AI_MODEL_COMPARISON_ROWS
    const repeatForColumns = (value: string): string[] => columns.map(() => value)
    return [
      ['Deployment profile', ...repeatForColumns(this.selectedProfile())],
      ['Price cloud', ...repeatForColumns(this.priceCloudLabel)],
      ['Price region', ...repeatForColumns(this.selectedRegionLabel())],
      [
        'Price unit',
        ...repeatForColumns(`${this.catalog().currencyCode} / ${this.catalog().priceUnit}`),
      ],
      ['Input tokens / request', ...repeatForColumns(String(workload.inputTokensPerRequest))],
      ['Output tokens / request', ...repeatForColumns(String(workload.outputTokensPerRequest))],
      ['Requests / month', ...repeatForColumns(String(workload.requestsPerMonth))],
      ['Cached input', ...repeatForColumns(`${workload.cachedInputPercent}%`)],
      ['Cache write', ...repeatForColumns(`${workload.cacheWritePercent}%`)],
      [
        'Estimated cost / request',
        ...costColumns.map((column) => this.formatCostRange(column.cost?.perRequest)),
      ],
      [
        'Estimated monthly cost',
        ...costColumns.map((column) => this.formatCostRange(column.cost?.monthly)),
      ],
      [
        'Difference vs. lowest monthly cost',
        ...costColumns.map((column) => this.costDifferenceLabel(column)),
      ],
      [
        'Lowest estimated price regions',
        ...costColumns.map((column) => this.costLowestRegionsLabel(column.cost)),
      ],
      ...(batchProfile && this.hasBatchEstimates()
        ? [
            [
              `${batchProfile} estimated monthly cost`,
              ...costColumns.map((column) => this.formatCostRange(column.batchCost?.monthly)),
            ],
          ]
        : []),
      ...rowKeys.map((row) => [
        this.comparisonRowLabel(row),
        ...columns.map((column) => this.comparisonValue(column, row)),
      ]),
    ]
  })

  constructor() {
    effect(() => {
      const data = this.aiModelComparisonPageData()
      const modelNames = data.models.map((model) => model.name)
      const description = modelNames.length
        ? `Compare ${modelNames.join(', ')} Microsoft Foundry token prices and workload costs for ${data.selectedProfile} in ${AI_MODEL_PRICE_CLOUD_LABEL}.`
        : 'Select up to four Microsoft Foundry models and compare input, cached input, cache write, and output token prices side by side.'
      this.seoService.setPageMeta({
        title: modelNames.length
          ? `${modelNames.length} Azure AI Model Prices Compared`
          : 'Compare Azure AI Model Token Prices',
        description,
        canonicalUrl: absoluteUrl(AI_MODEL_COMPARISON_HREF),
        structuredData: [
          buildBreadcrumbList([
            { name: 'Azure AI Model Pricing', path: AI_MODEL_PRICING_HREF },
            { name: 'Compare Azure AI models', path: AI_MODEL_COMPARISON_HREF },
          ]),
          buildSchemaNode('WebApplication', {
            name: 'Azure AI model price comparison',
            description,
            url: absoluteUrl(AI_MODEL_COMPARISON_HREF),
            applicationCategory: 'BusinessApplication',
          }),
        ],
      })
    })
  }

  addModel(modelId: string): void {
    if (!modelId || this.comparisonFull() || this.selectedModelIds().includes(modelId)) return
    this.navigateToSelection([...this.selectedModelIds(), modelId])
  }

  replaceModel(currentModelId: string, replacementModelId: string): void {
    if (!replacementModelId || replacementModelId === currentModelId) return
    this.navigateToSelection(
      this.selectedModelIds().map((modelId) =>
        modelId === currentModelId ? replacementModelId : modelId
      )
    )
  }

  modelOptionsFor(modelId: string): readonly ComparisonPickerOption[] {
    return this.replacementModelOptions().get(modelId) ?? []
  }

  removeModel(modelId: string): void {
    this.navigateToSelection(this.selectedModelIds().filter((selectedId) => selectedId !== modelId))
  }

  clearComparison(): void {
    this.navigateToSelection([])
  }

  updateProfile(profile: string): void {
    this.navigateToSelection(this.selectedModelIds(), { profile })
  }

  updateRegion(region: string): void {
    this.navigateToSelection(this.selectedModelIds(), { region })
  }

  applyRecommendedScope(): void {
    const recommendation = this.scopeRecommendation()
    if (!recommendation) return
    this.navigateToSelection(this.selectedModelIds(), {
      profile: recommendation.profile,
      region: recommendation.region,
    })
  }

  updateShowDifferencesOnly(showDifferencesOnly: boolean): void {
    this.navigateToSelection(this.selectedModelIds(), { showDifferencesOnly })
  }

  updateWorkloadUrl(): void {
    if (this.workloadForm().invalid()) return
    this.navigateToSelection(this.selectedModelIds(), { workload: this.workloadModel() })
  }

  shouldShowRow(row: AiModelComparisonRowKey): boolean {
    return !this.showDifferencesOnly() || this.differingRows().has(row)
  }

  shouldShowGroup(group: AiModelComparisonGroupKey): boolean {
    return (
      !this.showDifferencesOnly() ||
      AI_MODEL_COMPARISON_GROUP_ROWS[group].some((row) => this.differingRows().has(row))
    )
  }

  comparisonRowLabel(row: AiModelComparisonRowKey): string {
    switch (row) {
      case 'provider':
        return 'Provider'
      case 'productFamily':
        return 'Azure product family'
      case 'input':
        return `Input / ${this.catalog().priceUnit}`
      case 'output':
        return `Output / ${this.catalog().priceUnit}`
      case 'cachedInput':
        return `Cached input / ${this.catalog().priceUnit}`
      case 'cacheWrite':
        return `Cache write / ${this.catalog().priceUnit}`
      case 'priceRegions':
        return 'Matching price regions'
      case 'effectiveDate':
        return 'Latest meter effective date'
    }
  }

  comparisonValue(column: AiModelComparisonColumn, row: AiModelComparisonRowKey): string {
    switch (row) {
      case 'provider':
        return column.model.provider
      case 'productFamily':
        return column.model.productNames.join(', ')
      case 'input':
        return this.formatPrice(column.summary?.input)
      case 'output':
        return this.formatPrice(column.summary?.output)
      case 'cachedInput':
        return this.formatPrice(column.summary?.cachedInput)
      case 'cacheWrite':
        return this.formatPrice(column.summary?.cacheWrite)
      case 'priceRegions':
        return String(column.summary?.priceRegionCount ?? 0)
      case 'effectiveDate':
        return this.formatEffectiveDate(column.summary?.effectiveStartDate)
    }
  }

  formatPrice(range: AiModelPriceRange | null | undefined): string {
    if (!range) return 'N/A'
    const minimum = this.priceFormatter().format(range.min)
    return range.min === range.max
      ? minimum
      : `${minimum} - ${this.priceFormatter().format(range.max)}`
  }

  formatCostRange(range: AiModelCostRange | null | undefined): string {
    if (!range) return 'N/A'
    const minimum = this.costFormatter().format(range.min)
    return costRangeIsScalar(range)
      ? minimum
      : `${minimum} - ${this.costFormatter().format(range.max)}`
  }

  costDifferenceLabel(column: AiModelCostColumn): string {
    if (!column.cost) return 'N/A'
    if (column.isLowest) return 'Lowest selected cost'
    return column.differencePercent === null
      ? 'Not ranked'
      : `+${this.percentFormatter.format(column.differencePercent)}%`
  }

  batchSavingsLabel(column: AiModelCostColumn): string {
    const savings = column.batchSavingsPercent
    if (savings === null) return ''
    return savings >= 0
      ? `${this.percentFormatter.format(savings)}% lower`
      : `${this.percentFormatter.format(Math.abs(savings))}% higher`
  }

  costRegionLabel(cost: AiModelCostEstimate): string {
    const coverage = `${cost.priceRegionCount} matching price ${cost.priceRegionCount === 1 ? 'region' : 'regions'}`
    return costRangeIsScalar(cost.monthly)
      ? coverage
      : `${coverage}; lowest estimate in ${this.formatCostRegionNames(cost.monthly.minRegions)}`
  }

  costLowestRegionsLabel(cost: AiModelCostEstimate | null): string {
    if (!cost) return 'N/A'
    return costRangeIsScalar(cost.monthly) && cost.priceRegionCount > 1
      ? `All ${cost.priceRegionCount} matching price regions`
      : this.formatCostRegionNames(cost.monthly.minRegions, Number.POSITIVE_INFINITY)
  }

  formatEffectiveDate(value: string | undefined): string {
    return value ? this.dateFormatter.format(new Date(value)) : 'N/A'
  }

  private formatCostRegionNames(regions: readonly string[], limit = 2): string {
    const labels = regions.map(
      (region) =>
        this.catalog().filters.regions.find((option) => option.value === region)?.label ?? region
    )
    const visibleLabels = labels.slice(0, limit)
    if (labels.length <= limit) {
      return visibleLabels.length <= 1
        ? (visibleLabels[0] ?? 'N/A')
        : `${visibleLabels.slice(0, -1).join(', ')} and ${visibleLabels.at(-1)}`
    }
    return `${visibleLabels.join(', ')}, and ${labels.length - limit} more`
  }

  private modelScopeHint(model: AiModelPricingEntry, profile: string, region: string): string {
    const sameProfileInPublic = model.pricing.some(
      (price) => price.profile === profile && aiModelRegionIsPublic(price.region)
    )
    if (region && sameProfileInPublic) {
      return `Available in other ${AI_MODEL_PRICE_CLOUD_LABEL} price regions.`
    }

    const profilesInPublic = [
      ...new Set(
        model.pricing
          .filter((price) => aiModelRegionIsPublic(price.region))
          .map((price) => price.profile)
      ),
    ].sort(
      (left, right) =>
        profileRecommendationRank(left) - profileRecommendationRank(right) ||
        NAME_COLLATOR.compare(left, right)
    )
    const [recommendedProfile] = profilesInPublic
    return recommendedProfile
      ? `Available under ${recommendedProfile} in ${AI_MODEL_PRICE_CLOUD_LABEL}.`
      : `No published ${AI_MODEL_PRICE_CLOUD_LABEL} meter is available in another comparison scope.`
  }

  private navigateToSelection(
    modelIds: readonly string[],
    overrides: AiModelNavigationOverrides = {}
  ): void {
    const profile = overrides.profile ?? this.selectedProfile()
    const region = overrides.region ?? this.selectedRegion()
    const showDifferencesOnly = overrides.showDifferencesOnly ?? this.showDifferencesOnly()
    const workload = overrides.workload ?? this.workloadModel()
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        models: modelIds.length ? modelIds.join(',') : null,
        profile,
        cloud: null,
        region: region || null,
        diff: showDifferencesOnly ? '1' : null,
        inputTokens: queryNumber(
          workload.inputTokensPerRequest,
          DEFAULT_AI_MODEL_WORKLOAD.inputTokensPerRequest
        ),
        outputTokens: queryNumber(
          workload.outputTokensPerRequest,
          DEFAULT_AI_MODEL_WORKLOAD.outputTokensPerRequest
        ),
        requests: queryNumber(
          workload.requestsPerMonth,
          DEFAULT_AI_MODEL_WORKLOAD.requestsPerMonth
        ),
        cached: queryNumber(
          workload.cachedInputPercent,
          DEFAULT_AI_MODEL_WORKLOAD.cachedInputPercent
        ),
        cacheWrite: queryNumber(
          workload.cacheWritePercent,
          DEFAULT_AI_MODEL_WORKLOAD.cacheWritePercent
        ),
      },
    })
  }
}
