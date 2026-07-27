import { readFileSync } from 'fs'
import { join } from 'path'

import type { Region, RegionLatencyMatrix } from './models'
import {
  getServiceTagRouteIds,
  getSovereignServiceTagRouteParams,
  SovereignServiceTagRouteParam,
} from './services/service-tags-assets.server'
import { toRegionNameNoSpace } from './shared/utils'

interface AzureRegionToRegionLatencyParam extends Record<string, string> {
  sourceRegion: string
}

interface AzureIpRangeParam extends Record<string, string> {
  serviceTagId: string
}

interface AzureRegionDetailParam extends Record<string, string> {
  regionId: string
}

interface AzureVmSkuParam extends Record<string, string> {
  armSkuName: string
}

interface AzureVmRegionParam extends Record<string, string> {
  armRegionName: string
}

interface AzureVmSeriesParam extends Record<string, string> {
  seriesSlug: string
}

interface VmCatalogRoutesDocument {
  readonly skuNames: readonly string[]
  readonly seriesSlugs: readonly string[]
  readonly regions: readonly {
    readonly armRegionName: string
    readonly indexable: boolean
  }[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((entry: unknown) => typeof entry === 'string' && entry.length > 0)
  )
}

function isVmRegionRouteArray(
  value: unknown
): value is { readonly armRegionName: string; readonly indexable: boolean }[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry: unknown) =>
        isRecord(entry) &&
        typeof entry['armRegionName'] === 'string' &&
        entry['armRegionName'].length > 0 &&
        typeof entry['indexable'] === 'boolean'
    )
  )
}

function readJsonFile<T>(path: string, description: string): T {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read ${description} from ${path}: ${message}`, { cause: error })
  }
}

function assertUnique(values: readonly string[], description: string): void {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value)
    }
    seen.add(value)
  }

  if (duplicates.size > 0) {
    throw new Error(`${description} contains duplicate values: ${[...duplicates].join(', ')}`)
  }
}

function getRegions(): Region[] {
  const regionFiles = [
    {
      path: join(process.cwd(), 'src', 'assets', 'data', 'regions.json'),
      description: 'Azure global regions',
    },
    {
      path: join(process.cwd(), 'src', 'assets', 'data', 'regions-china.json'),
      description: 'Azure China regions',
    },
    {
      path: join(process.cwd(), 'src', 'assets', 'data', 'regions-usgov.json'),
      description: 'Azure US Government regions',
    },
  ]

  const regions = regionFiles.flatMap(({ path, description }) => {
    const data = readJsonFile<Region[]>(path, description)

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`${description} at ${path} must be a non-empty array.`)
    }

    return data
  })

  if (regions.length === 0) {
    throw new Error('Azure region files must contain at least one region.')
  }

  return regions
}

function getVmCatalogRoutes(): VmCatalogRoutesDocument {
  const routesPath = join(process.cwd(), 'public', 'vm-catalog', 'routes.json')
  const value = readJsonFile<unknown>(routesPath, 'Azure VM catalog routes')

  if (
    !isRecord(value) ||
    !isStringArray(value['skuNames']) ||
    !isStringArray(value['seriesSlugs']) ||
    !isVmRegionRouteArray(value['regions'])
  ) {
    throw new Error(`Azure VM catalog routes at ${routesPath} are invalid.`)
  }

  const routes: VmCatalogRoutesDocument = {
    skuNames: value['skuNames'],
    seriesSlugs: value['seriesSlugs'],
    regions: value['regions'],
  }
  assertUnique(routes.skuNames, 'Azure VM SKU route names')
  assertUnique(routes.seriesSlugs, 'Azure VM series route slugs')
  assertUnique(
    routes.regions.map((region) => region.armRegionName),
    'Azure VM region route names'
  )
  return routes
}

export function getRegionToRegionLatencyParams(): AzureRegionToRegionLatencyParam[] {
  const matrixPath = join(process.cwd(), 'src', 'assets', 'data', 'region-latency-matrix.json')
  const matrix = readJsonFile<RegionLatencyMatrix>(matrixPath, 'Azure latency matrix')

  if (!isStringArray(matrix.sourceRegions) || matrix.sourceRegions.length === 0) {
    throw new Error(`Azure latency matrix at ${matrixPath} must contain source regions.`)
  }

  const sourceRegions = matrix.sourceRegions.map(toRegionNameNoSpace)
  assertUnique(sourceRegions, 'Azure latency source region route IDs')

  return sourceRegions.map((sourceRegion) => ({ sourceRegion }))
}

export function getAzureIpRangeParams(): AzureIpRangeParam[] {
  const serviceTagIds = getServiceTagRouteIds()

  if (serviceTagIds.length === 0) {
    throw new Error('Azure service tag manifest contains no service tags.')
  }

  return serviceTagIds.map((serviceTagId) => ({ serviceTagId }))
}

export function getSovereignAzureIpRangeParams(): SovereignServiceTagRouteParam[] {
  const params = getSovereignServiceTagRouteParams()

  if (params.length === 0) {
    throw new Error('Azure service tag manifest contains no sovereign cloud service tags.')
  }

  return params
}

export function getAzureRegionDetailParams(): AzureRegionDetailParam[] {
  const regionIds = getRegions().map((region) => toRegionNameNoSpace(region.displayName))

  assertUnique(regionIds, 'Azure region route IDs')

  return regionIds.map((regionId) => ({ regionId }))
}

export function getAzureVmSkuParams(): AzureVmSkuParam[] {
  return getVmCatalogRoutes().skuNames.map((armSkuName) => ({ armSkuName }))
}

export function getAzureVmSeriesParams(): AzureVmSeriesParam[] {
  return getVmCatalogRoutes().seriesSlugs.map((seriesSlug) => ({ seriesSlug }))
}

export function getAzureVmRegionParams(): AzureVmRegionParam[] {
  return getVmCatalogRoutes().regions.map(({ armRegionName }) => ({ armRegionName }))
}
