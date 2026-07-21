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
  legacyServiceTagIds: string[]
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

function loadServiceTagRoutes(): ServiceTagRoutesDocument {
  if (cachedRoutes) return cachedRoutes

  const routesPath = join(process.cwd(), 'scripts', 'data', 'service-tags-routes.json')
  cachedRoutes = readJsonFile<ServiceTagRoutesDocument>(routesPath, 'Azure service tag routes')
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
  return loadServiceTagRoutes().legacyServiceTagIds
}

export function getSovereignServiceTagRouteParams(): SovereignServiceTagRouteParam[] {
  return loadServiceTagRoutes().sovereignServiceTags
}
