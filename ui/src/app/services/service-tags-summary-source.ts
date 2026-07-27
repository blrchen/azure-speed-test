import { HttpClient } from '@angular/common/http'
import { inject, InjectionToken, Service } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import {
  ServiceTagCloud,
  serviceTagSummaryShardPath,
  ServiceTagSummaryWire,
} from './service-tags-snapshot'

export interface ServiceTagSummarySource {
  load(cloud: ServiceTagCloud, serviceTagId: string): Promise<ServiceTagSummaryWire | null>
  clear(cloud: ServiceTagCloud, serviceTagId: string): void
}

export interface ServiceTagSummaryShardWire {
  serviceTags: Record<string, ServiceTagSummaryWire>
}

export function extractServiceTagSummary(
  shard: ServiceTagSummaryShardWire,
  serviceTagId: string
): ServiceTagSummaryWire | null {
  return shard.serviceTags[serviceTagId] ?? null
}

@Service()
class HttpServiceTagSummarySource implements ServiceTagSummarySource {
  private readonly http = inject(HttpClient)
  private readonly shardPromises = new Map<string, Promise<ServiceTagSummaryShardWire>>()

  async load(cloud: ServiceTagCloud, serviceTagId: string): Promise<ServiceTagSummaryWire | null> {
    const path = serviceTagSummaryShardPath(cloud, serviceTagId)
    let promise = this.shardPromises.get(path)
    if (!promise) {
      promise = firstValueFrom(
        this.http.get<ServiceTagSummaryShardWire>(path, { transferCache: false })
      ).catch((error) => {
        this.shardPromises.delete(path)
        throw error
      })
      this.shardPromises.set(path, promise)
    }

    return extractServiceTagSummary(await promise, serviceTagId)
  }

  clear(cloud: ServiceTagCloud, serviceTagId: string): void {
    this.shardPromises.delete(serviceTagSummaryShardPath(cloud, serviceTagId))
  }
}

export const SERVICE_TAG_SUMMARY_SOURCE = new InjectionToken<ServiceTagSummarySource>(
  'service-tag-summary-source',
  {
    providedIn: 'root',
    factory: () => inject(HttpServiceTagSummarySource),
  }
)
