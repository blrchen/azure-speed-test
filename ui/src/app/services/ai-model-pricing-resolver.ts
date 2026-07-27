import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router'

import {
  AI_MODEL_COMPARISON_LIMIT,
  AiModelComparisonPageData,
  AiModelPricingCatalog,
  aiModelRegionIsPublic,
  DEFAULT_AI_MODEL_PROFILE,
  DEFAULT_AI_MODEL_WORKLOAD,
} from './ai-model-pricing'
import { AiModelPricingLoader } from './ai-model-pricing-loader'

export const aiModelPricingCatalogResolver: ResolveFn<AiModelPricingCatalog> = () =>
  inject(AiModelPricingLoader).getCatalog()

function normalizeRequestedProfile(value: string): string {
  return value.replace(/\s*-\s*short context$/i, '').trim()
}

function parseQueryNumber(value: string | null, fallback: number): number {
  if (value === null || value.trim() === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const aiModelComparisonResolver: ResolveFn<AiModelComparisonPageData> = async (
  route: ActivatedRouteSnapshot
) => {
  const catalog = await inject(AiModelPricingLoader).getCatalog()
  const modelsById = new Map(catalog.models.map((model) => [model.id.toLowerCase(), model]))
  const requestedIds = (route.queryParamMap.get('models') ?? '')
    .split(',')
    .map((modelId) => modelId.trim())
    .filter(Boolean)
  const models = []
  const invalidModelIds: string[] = []
  const omittedModelIds: string[] = []
  const seenIds = new Set<string>()

  for (const requestedId of requestedIds) {
    const normalizedId = requestedId.toLowerCase()
    if (seenIds.has(normalizedId)) continue
    seenIds.add(normalizedId)
    const model = modelsById.get(normalizedId)
    if (!model) {
      invalidModelIds.push(requestedId)
    } else if (models.length >= AI_MODEL_COMPARISON_LIMIT) {
      omittedModelIds.push(model.id)
    } else {
      models.push(model)
    }
  }

  const requestedProfile = normalizeRequestedProfile(
    route.queryParamMap.get('profile')?.trim().toLowerCase() ?? ''
  )
  const selectedProfile =
    catalog.filters.profiles.find((profile) => profile.toLowerCase() === requestedProfile) ??
    (catalog.filters.profiles.includes(DEFAULT_AI_MODEL_PROFILE)
      ? DEFAULT_AI_MODEL_PROFILE
      : catalog.filters.profiles[0])
  const requestedRegion = route.queryParamMap.get('region')?.trim().toLowerCase() ?? ''
  const resolvedRegion =
    catalog.filters.regions.find((region) => region.value.toLowerCase() === requestedRegion)
      ?.value ?? ''
  const selectedRegion =
    resolvedRegion && aiModelRegionIsPublic(resolvedRegion) ? resolvedRegion : ''
  const showDifferencesOnly = route.queryParamMap.get('diff') === '1'
  const cachedInputPercent = parseQueryNumber(
    route.queryParamMap.get('cached'),
    DEFAULT_AI_MODEL_WORKLOAD.cachedInputPercent
  )
  const cacheWritePercent = parseQueryNumber(
    route.queryParamMap.get('cacheWrite'),
    DEFAULT_AI_MODEL_WORKLOAD.cacheWritePercent
  )
  const workload = {
    inputTokensPerRequest: parseQueryNumber(
      route.queryParamMap.get('inputTokens'),
      DEFAULT_AI_MODEL_WORKLOAD.inputTokensPerRequest
    ),
    outputTokensPerRequest: parseQueryNumber(
      route.queryParamMap.get('outputTokens'),
      DEFAULT_AI_MODEL_WORKLOAD.outputTokensPerRequest
    ),
    requestsPerMonth: parseQueryNumber(
      route.queryParamMap.get('requests'),
      DEFAULT_AI_MODEL_WORKLOAD.requestsPerMonth
    ),
    cachedInputPercent,
    cacheWritePercent,
  }

  return {
    catalog,
    models,
    invalidModelIds,
    omittedModelIds,
    selectedProfile,
    selectedRegion,
    showDifferencesOnly,
    workload,
  }
}
