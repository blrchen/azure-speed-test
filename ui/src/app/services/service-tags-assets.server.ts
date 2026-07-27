import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ServiceTagCloud, serviceTagSummaryShardPath } from './service-tags-snapshot'
import {
  extractServiceTagSummary,
  ServiceTagSummaryShardWire,
  ServiceTagSummarySource,
} from './service-tags-summary-source'

export interface SovereignServiceTagRouteParam extends Record<string, string> {
  cloud: Exclude<ServiceTagCloud, 'public'>
  serviceTagId: string
}

interface ServiceTagRoutesDocument {
  implicitCloudRouteServiceTagIds: string[]
  sovereignServiceTags: SovereignServiceTagRouteParam[]
}

let cachedRoutes: ServiceTagRoutesDocument | undefined
const cachedSummaryShards = new Map<string, ServiceTagSummaryShardWire>()

function readJsonFile<T>(path: string, description: string): T {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read ${description} from ${path}: ${message}`, { cause: error })
  }
}

/**
 * The keys below are a contract with `scripts/data/service-tags-routes.json`, which is
 * generated rather than hand-written. `readJsonFile` only casts, so a renamed or missing
 * key would otherwise surface as `undefined` far downstream (prerendering reads `.length`
 * off these arrays). Validate at the read site so the failure names the offending file.
 */
function assertServiceTagRoutes(document: unknown, path: string): ServiceTagRoutesDocument {
  const candidate = document as Partial<ServiceTagRoutesDocument> | null

  for (const key of ['implicitCloudRouteServiceTagIds', 'sovereignServiceTags'] as const) {
    if (!Array.isArray(candidate?.[key])) {
      throw new Error(`Azure service tag routes at ${path} is missing the "${key}" array`)
    }
  }

  return candidate as ServiceTagRoutesDocument
}

function loadServiceTagRoutes(): ServiceTagRoutesDocument {
  if (cachedRoutes) return cachedRoutes

  const routesPath = join(process.cwd(), 'scripts', 'data', 'service-tags-routes.json')
  cachedRoutes = assertServiceTagRoutes(
    readJsonFile<unknown>(routesPath, 'Azure service tag routes'),
    routesPath
  )
  return cachedRoutes
}

function summaryShardPath(cloud: ServiceTagCloud, serviceTagId: string): string {
  return join(
    process.cwd(),
    'public',
    ...serviceTagSummaryShardPath(cloud, serviceTagId).split('/')
  )
}

export const SERVER_SERVICE_TAG_SUMMARY_SOURCE: ServiceTagSummarySource = {
  load(cloud, serviceTagId) {
    const path = summaryShardPath(cloud, serviceTagId)
    let shard = cachedSummaryShards.get(path)
    if (!shard) {
      shard = readJsonFile<ServiceTagSummaryShardWire>(path, 'Azure service tag summary shard')
      cachedSummaryShards.set(path, shard)
    }

    return Promise.resolve(extractServiceTagSummary(shard, serviceTagId))
  },

  clear(cloud, serviceTagId) {
    cachedSummaryShards.delete(summaryShardPath(cloud, serviceTagId))
  },
}

export function getServiceTagRouteIds(): string[] {
  return loadServiceTagRoutes().implicitCloudRouteServiceTagIds
}

export function getSovereignServiceTagRouteParams(): SovereignServiceTagRouteParam[] {
  return loadServiceTagRoutes().sovereignServiceTags
}
