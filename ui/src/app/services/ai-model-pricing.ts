export const AI_MODEL_PRICING_ASSET_PATH = '/ai-model-pricing/catalog.json'
export const AI_MODEL_PRICING_HREF = '/AzureAiModelPricing'
export const AI_MODEL_COMPARISON_HREF = '/AzureAiModelPricing/Compare'
export const DEFAULT_AI_MODEL_PROFILE = 'Global Standard'
export const AI_MODEL_COMPARISON_LIMIT = 4
export const AI_MODEL_PRICE_CLOUD_LABEL = 'Azure Public'
export const AI_MODEL_WORKLOAD_LIMITS = {
  tokensPerRequest: 1_000_000_000,
  requestsPerMonth: 1_000_000_000_000,
  percent: 100,
} as const
const TOKENS_PER_PRICE_UNIT = 1_000_000
const MICROSOFT_FOUNDRY_CATALOG_HREF = 'https://ai.azure.com/catalog'
const MICROSOFT_FOUNDRY_PRICING_HREF =
  'https://azure.microsoft.com/en-us/pricing/details/microsoft-foundry/'
const MICROSOFT_FOUNDRY_MODELS_SOLD_BY_AZURE_HREF =
  'https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure'
export const MICROSOFT_FOUNDRY_DEPLOYMENT_TYPES_HREF =
  'https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types'
const MICROSOFT_AZURE_OPENAI_PRICING_HREF =
  'https://azure.microsoft.com/en-us/pricing/details/azure-openai/'
const MICROSOFT_AZURE_RETAIL_PRICES_API_HREF =
  'https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices'

export const AI_MODEL_PRICING_OFFICIAL_SOURCES = [
  {
    title: 'Microsoft Foundry pricing',
    description: 'Review the official platform pricing overview and Azure purchasing guidance.',
    href: MICROSOFT_FOUNDRY_PRICING_HREF,
  },
  {
    title: 'Microsoft Foundry model catalog',
    description: 'Browse the broader official model catalog, providers, APIs, and capabilities.',
    href: MICROSOFT_FOUNDRY_CATALOG_HREF,
  },
  {
    title: 'Foundry Models sold by Azure',
    description: 'Check model IDs, context windows, APIs, capabilities, and lifecycle guidance.',
    href: MICROSOFT_FOUNDRY_MODELS_SOLD_BY_AZURE_HREF,
  },
  {
    title: 'Azure OpenAI pricing',
    description: "Review Microsoft's public model tables and current Azure OpenAI list prices.",
    href: MICROSOFT_AZURE_OPENAI_PRICING_HREF,
  },
  {
    title: 'Foundry deployment types',
    description: 'Understand data processing scope, pay-per-token, Batch, and provisioned PTUs.',
    href: MICROSOFT_FOUNDRY_DEPLOYMENT_TYPES_HREF,
  },
  {
    title: 'Azure Retail Prices API',
    description: 'See the Microsoft API documentation for the retail meter data used here.',
    href: MICROSOFT_AZURE_RETAIL_PRICES_API_HREF,
  },
] as const

type AiModelPriceField = 'cacheWrite' | 'cachedInput' | 'input' | 'output'

interface AiModelPricingProfileGuide {
  readonly billingDescription: string
  readonly billingLabel: string
  readonly contextDescription: string | null
  readonly processingDescription: string
  readonly processingLabel: string
}

interface AiModelPricePoint {
  readonly profile: string
  readonly region: string
  readonly input: number | null
  readonly output: number | null
  readonly cachedInput: number | null
  readonly cacheWrite: number | null
  readonly effectiveStartDate: string
}

export interface AiModelPricingEntry {
  readonly id: string
  readonly name: string
  readonly provider: string
  readonly productNames: readonly string[]
  readonly searchText: string
  readonly pricing: readonly AiModelPricePoint[]
}

interface AiModelFilterOption {
  readonly value: string
  readonly label?: string
  readonly count?: number
}

export interface AiModelPricingCatalog {
  readonly currencyCode: string
  readonly priceUnit: string
  readonly source: {
    readonly name: string
    readonly url: string
    readonly filter: string
    readonly rawRowCount: number
    readonly comparableRowCount: number
  }
  readonly counts: {
    readonly modelCount: number
    readonly providerCount: number
    readonly profileCount: number
    readonly regionCount: number
    readonly pricePointCount: number
  }
  readonly filters: {
    readonly providers: readonly AiModelFilterOption[]
    readonly profiles: readonly string[]
    readonly regions: readonly AiModelFilterOption[]
  }
  readonly models: readonly AiModelPricingEntry[]
}

export interface AiModelPriceRange {
  readonly min: number
  readonly max: number
}

export interface AiModelWorkload {
  readonly inputTokensPerRequest: number
  readonly outputTokensPerRequest: number
  readonly requestsPerMonth: number
  readonly cachedInputPercent: number
  readonly cacheWritePercent: number
}

export const DEFAULT_AI_MODEL_WORKLOAD: AiModelWorkload = {
  inputTokensPerRequest: 3_000,
  outputTokensPerRequest: 1_000,
  requestsPerMonth: 10_000,
  cachedInputPercent: 0,
  cacheWritePercent: 0,
}

export interface AiModelCostRange extends AiModelPriceRange {
  readonly minRegions: readonly string[]
  readonly maxRegions: readonly string[]
}

export interface AiModelCostEstimate {
  readonly perRequest: AiModelCostRange
  readonly monthly: AiModelCostRange
  readonly priceRegionCount: number
}

export interface AiModelPriceSummary {
  readonly input: AiModelPriceRange | null
  readonly output: AiModelPriceRange | null
  readonly cachedInput: AiModelPriceRange | null
  readonly cacheWrite: AiModelPriceRange | null
  readonly priceRegionCount: number
  readonly effectiveStartDate: string
}

export interface AiModelComparisonPageData {
  readonly catalog: AiModelPricingCatalog
  readonly models: readonly AiModelPricingEntry[]
  readonly invalidModelIds: readonly string[]
  readonly omittedModelIds: readonly string[]
  readonly selectedProfile: string
  readonly selectedRegion: string
  readonly showDifferencesOnly: boolean
  readonly workload: AiModelWorkload
}

export function aiModelRegionIsPublic(region: string): boolean {
  return !/^(?:china|usdod|usgov)/i.test(region)
}

export function getAiModelBatchProfile(profile: string): string | null {
  const match = /^(Global|Data Zone|Regional) Standard(?: - Long context)?$/.exec(profile)
  if (!match) return null
  const contextSuffix = profile.endsWith(' - Long context') ? ' - Long context' : ''
  return `${match[1]} Batch${contextSuffix}`
}

export function getAiModelPricingProfileGuide(profile: string): AiModelPricingProfileGuide {
  const resolvedProfile = profile || DEFAULT_AI_MODEL_PROFILE
  const processing = resolvedProfile.startsWith('Global ')
    ? {
        label: 'Global processing',
        description: 'Inference data may be processed in any Azure region.',
      }
    : resolvedProfile.startsWith('Data Zone ')
      ? {
          label: 'Data Zone processing',
          description:
            'Inference data is processed within the Microsoft-specified US, EU, or APAC data zone.',
        }
      : {
          label: 'Single-region processing',
          description:
            'Inference data is processed in the deployment region. Microsoft names the pay-per-token deployment type Standard; this directory uses Regional Standard to make its scope explicit.',
        }

  const billing = resolvedProfile.includes('Batch')
    ? {
        label: 'Asynchronous Batch',
        description:
          'Batch meters cover asynchronous jobs. Microsoft documents Global and Data Zone Batch at a 50% discount, with a 24-hour target for Global Batch; model support varies.',
      }
    : resolvedProfile.includes('Priority')
      ? {
          label: 'Priority pay-per-token',
          description:
            'Priority processing uses pay-as-you-go token meters for faster responses. Model and deployment support varies.',
        }
      : {
          label: 'Standard pay-per-token',
          description:
            'Input and output usage is billed by token. Standard deployments provide best-effort throughput; reserved PTU pricing is separate.',
        }

  const contextDescription = resolvedProfile.includes('Long context')
    ? 'Long-context meter selected. The token threshold that activates it is model-specific.'
    : resolvedProfile.includes('Short context')
      ? 'Short-context meter selected. The applicable token threshold is model-specific.'
      : null

  return {
    billingDescription: billing.description,
    billingLabel: billing.label,
    contextDescription,
    processingDescription: processing.description,
    processingLabel: processing.label,
  }
}

function toPriceRange(values: readonly number[]): AiModelPriceRange | null {
  if (values.length === 0) return null
  return { min: Math.min(...values), max: Math.max(...values) }
}

export function summarizeAiModelPricing(
  model: AiModelPricingEntry,
  profile: string,
  region: string
): AiModelPriceSummary | null {
  const matchingPrices = model.pricing.filter(
    (price) =>
      price.profile === profile &&
      (!region || price.region === region) &&
      aiModelRegionIsPublic(price.region)
  )
  if (matchingPrices.length === 0) return null

  const values = (field: AiModelPriceField): readonly number[] =>
    matchingPrices.map((price) => price[field]).filter((value): value is number => value !== null)

  return {
    input: toPriceRange(values('input')),
    output: toPriceRange(values('output')),
    cachedInput: toPriceRange(values('cachedInput')),
    cacheWrite: toPriceRange(values('cacheWrite')),
    priceRegionCount: new Set(matchingPrices.map((price) => price.region)).size,
    effectiveStartDate: matchingPrices.reduce(
      (latest, price) => (price.effectiveStartDate > latest ? price.effectiveStartDate : latest),
      ''
    ),
  }
}

function estimatePricePointCost(
  price: AiModelPricePoint,
  workload: AiModelWorkload
): number | null {
  const cachedInputTokens = workload.inputTokensPerRequest * (workload.cachedInputPercent / 100)
  const cacheWriteTokens = workload.inputTokensPerRequest * (workload.cacheWritePercent / 100)
  const standardInputTokens = workload.inputTokensPerRequest - cachedInputTokens - cacheWriteTokens
  if (standardInputTokens < 0) return null

  const standardInputPrice = price.input
  const cachedInputPrice = price.cachedInput ?? standardInputPrice
  const cacheWritePrice = price.cacheWrite ?? standardInputPrice
  if (standardInputTokens > 0 && standardInputPrice === null) return null
  if (cachedInputTokens > 0 && cachedInputPrice === null) return null
  if (cacheWriteTokens > 0 && cacheWritePrice === null) return null
  if (workload.outputTokensPerRequest > 0 && price.output === null) return null

  return (
    (standardInputTokens * (standardInputPrice ?? 0) +
      cachedInputTokens * (cachedInputPrice ?? 0) +
      cacheWriteTokens * (cacheWritePrice ?? 0) +
      workload.outputTokensPerRequest * (price.output ?? 0)) /
    TOKENS_PER_PRICE_UNIT
  )
}

function workloadIsValid(workload: AiModelWorkload): boolean {
  const values = [
    workload.inputTokensPerRequest,
    workload.outputTokensPerRequest,
    workload.requestsPerMonth,
    workload.cachedInputPercent,
    workload.cacheWritePercent,
  ]
  return (
    values.every(Number.isFinite) &&
    workload.inputTokensPerRequest >= 0 &&
    workload.inputTokensPerRequest <= AI_MODEL_WORKLOAD_LIMITS.tokensPerRequest &&
    workload.outputTokensPerRequest >= 0 &&
    workload.outputTokensPerRequest <= AI_MODEL_WORKLOAD_LIMITS.tokensPerRequest &&
    workload.requestsPerMonth >= 0 &&
    workload.requestsPerMonth <= AI_MODEL_WORKLOAD_LIMITS.requestsPerMonth &&
    workload.cachedInputPercent >= 0 &&
    workload.cachedInputPercent <= AI_MODEL_WORKLOAD_LIMITS.percent &&
    workload.cacheWritePercent >= 0 &&
    workload.cacheWritePercent <= AI_MODEL_WORKLOAD_LIMITS.percent &&
    workload.cachedInputPercent + workload.cacheWritePercent <= AI_MODEL_WORKLOAD_LIMITS.percent
  )
}

function toCostRange(
  regionalCosts: readonly { readonly region: string; readonly value: number }[],
  multiplier = 1
): AiModelCostRange {
  const minimum = Math.min(...regionalCosts.map((cost) => cost.value))
  const maximum = Math.max(...regionalCosts.map((cost) => cost.value))
  const matches = (value: number, target: number): boolean =>
    Math.abs(value - target) <= Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(target)) * 8
  const matchingRegions = (target: number): readonly string[] => [
    ...new Set(
      regionalCosts.filter((cost) => matches(cost.value, target)).map((cost) => cost.region)
    ),
  ]
  return {
    min: minimum * multiplier,
    max: maximum * multiplier,
    minRegions: matchingRegions(minimum),
    maxRegions: matchingRegions(maximum),
  }
}

export function estimateAiModelCost(
  model: AiModelPricingEntry,
  profile: string,
  region: string,
  workload: AiModelWorkload
): AiModelCostEstimate | null {
  if (!workloadIsValid(workload)) return null

  const regionalCosts = model.pricing
    .filter(
      (price) =>
        price.profile === profile &&
        (!region || price.region === region) &&
        aiModelRegionIsPublic(price.region)
    )
    .map((price) => ({ region: price.region, value: estimatePricePointCost(price, workload) }))
    .filter(
      (cost): cost is { readonly region: string; readonly value: number } => cost.value !== null
    )
  if (regionalCosts.length === 0) return null

  return {
    perRequest: toCostRange(regionalCosts),
    monthly: toCostRange(regionalCosts, workload.requestsPerMonth),
    priceRegionCount: new Set(regionalCosts.map((cost) => cost.region)).size,
  }
}
