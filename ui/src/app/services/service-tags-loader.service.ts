import { isPlatformServer } from '@angular/common'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { inject, makeStateKey, PLATFORM_ID, Service, TransferState } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import {
  decodeServiceTagServiceDirectories,
  decodeServiceTagSummary,
  inferLegacyServiceTagCloud,
  normalizeServiceTagIdInput,
  SERVICE_TAG_CLOUDS,
  SERVICE_TAG_REGION_DIRECTORY_PATH,
  SERVICE_TAG_SERVICE_DIRECTORY_PATH,
  ServiceTagCloud,
  ServiceTagPageData,
  ServiceTagRegionDirectories,
  serviceTagRemainingPrefixesPath,
  ServiceTagServiceDirectories,
  ServiceTagServiceDirectoriesWire,
  ServiceTagSummaryWire,
} from './service-tags-snapshot'
import { SERVICE_TAG_SUMMARY_SOURCE, ServiceTagSummarySource } from './service-tags-summary-source'

interface TransferredServiceTagSummary {
  summary: ServiceTagSummaryWire | null
}

function isHttpNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404
}

function mergeRemainingPrefixes(
  pageData: ServiceTagPageData,
  remainingPrefixes: string[]
): ServiceTagPageData {
  const prefixes = [...pageData.ipAddressPrefixes, ...remainingPrefixes]
  prefixes.sort((left, right) => left.localeCompare(right))

  return {
    ...pageData,
    ipAddressPrefixes: prefixes,
    loadedPrefixCount: prefixes.length,
    prefixesComplete: true,
  }
}

function summaryTransferStateKey(cloud: ServiceTagCloud, serviceTagId: string) {
  return makeStateKey<TransferredServiceTagSummary>(`service-tag-summary:${cloud}:${serviceTagId}`)
}

@Service()
export class ServiceTagsLoader {
  private readonly http = inject(HttpClient)
  private readonly summarySource: ServiceTagSummarySource = inject(SERVICE_TAG_SUMMARY_SOURCE)
  private readonly transferState = inject(TransferState)
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID))
  private regionDirectoriesPromise: Promise<ServiceTagRegionDirectories> | undefined
  private serviceDirectoriesPromise: Promise<ServiceTagServiceDirectories> | undefined
  private readonly tagPromises = new Map<string, Promise<ServiceTagPageData | null>>()
  private readonly allPrefixesTagPromises = new Map<string, Promise<ServiceTagPageData | null>>()

  getRegionDirectories(): Promise<ServiceTagRegionDirectories> {
    this.regionDirectoriesPromise ??= firstValueFrom(
      this.http.get<ServiceTagRegionDirectories>(SERVICE_TAG_REGION_DIRECTORY_PATH)
    ).catch((error) => {
      this.regionDirectoriesPromise = undefined
      throw error
    })

    return this.regionDirectoriesPromise
  }

  reloadRegionDirectories(): Promise<ServiceTagRegionDirectories> {
    this.regionDirectoriesPromise = undefined
    return this.getRegionDirectories()
  }

  getServiceDirectories(): Promise<ServiceTagServiceDirectories> {
    this.serviceDirectoriesPromise ??= firstValueFrom(
      this.http.get<ServiceTagServiceDirectoriesWire>(SERVICE_TAG_SERVICE_DIRECTORY_PATH)
    )
      .then(decodeServiceTagServiceDirectories)
      .catch((error) => {
        this.serviceDirectoriesPromise = undefined
        throw error
      })

    return this.serviceDirectoriesPromise
  }

  reloadServiceDirectories(): Promise<ServiceTagServiceDirectories> {
    this.serviceDirectoriesPromise = undefined
    return this.getServiceDirectories()
  }

  getServiceTagPageData(
    cloud: ServiceTagCloud,
    serviceTagIdInput: string | undefined
  ): Promise<ServiceTagPageData | null> {
    const serviceTagId = normalizeServiceTagIdInput(serviceTagIdInput)
    const cacheKey = `${cloud}/${serviceTagId}`
    const existing = this.tagPromises.get(cacheKey)
    if (existing) return existing

    const promise = this.loadSummary(cloud, serviceTagId)
      .then((summary) => {
        if (summary === null) return null
        return decodeServiceTagSummary(summary, cloud, serviceTagId)
      })
      .catch((error) => {
        this.tagPromises.delete(cacheKey)
        throw error
      })

    this.tagPromises.set(cacheKey, promise)
    return promise
  }

  async getLegacyServiceTagPageData(
    serviceTagIdInput: string | undefined
  ): Promise<ServiceTagPageData | null> {
    const serviceTagId = normalizeServiceTagIdInput(serviceTagIdInput)
    const preferredCloud = inferLegacyServiceTagCloud(serviceTagId)
    const cloudOrder = [
      preferredCloud,
      ...SERVICE_TAG_CLOUDS.filter((cloud) => cloud !== preferredCloud),
    ]

    for (const cloud of cloudOrder) {
      const data = await this.getServiceTagPageData(cloud, serviceTagId)
      if (data) return data
    }

    return null
  }

  reloadServiceTagPageData(
    cloud: ServiceTagCloud,
    serviceTagIdInput: string | undefined
  ): Promise<ServiceTagPageData | null> {
    const serviceTagId = normalizeServiceTagIdInput(serviceTagIdInput)
    this.clearServiceTagCache(cloud, serviceTagId)
    return this.getServiceTagPageData(cloud, serviceTagId)
  }

  reloadLegacyServiceTagPageData(
    serviceTagIdInput: string | undefined
  ): Promise<ServiceTagPageData | null> {
    const serviceTagId = normalizeServiceTagIdInput(serviceTagIdInput)
    for (const cloud of SERVICE_TAG_CLOUDS) {
      this.clearServiceTagCache(cloud, serviceTagId)
    }
    return this.getLegacyServiceTagPageData(serviceTagId)
  }

  getAllPrefixesServiceTagPageData(
    cloud: ServiceTagCloud,
    serviceTagIdInput: string | undefined
  ): Promise<ServiceTagPageData | null> {
    const serviceTagId = normalizeServiceTagIdInput(serviceTagIdInput)
    const cacheKey = `${cloud}/${serviceTagId}`
    const existing = this.allPrefixesTagPromises.get(cacheKey)
    if (existing) return existing

    const promise = this.getServiceTagPageData(cloud, serviceTagId)
      .then(async (pageData) => {
        if (!pageData || pageData.prefixesComplete) return pageData

        const path = serviceTagRemainingPrefixesPath(cloud, serviceTagId)
        const remainingPrefixes = await firstValueFrom(
          this.http.get<string[]>(path, { transferCache: false })
        )
        return mergeRemainingPrefixes(pageData, remainingPrefixes)
      })
      .catch((error) => {
        if (isHttpNotFound(error)) return null

        this.allPrefixesTagPromises.delete(cacheKey)
        throw error
      })

    this.allPrefixesTagPromises.set(cacheKey, promise)
    return promise
  }

  private async loadSummary(
    cloud: ServiceTagCloud,
    serviceTagId: string
  ): Promise<ServiceTagSummaryWire | null> {
    const stateKey = summaryTransferStateKey(cloud, serviceTagId)
    if (this.transferState.hasKey(stateKey)) {
      const transferred = this.transferState.get(stateKey, { summary: null })
      if (!this.isServer) this.transferState.remove(stateKey)
      return transferred.summary
    }

    const summary = await this.summarySource.load(cloud, serviceTagId)
    if (this.isServer) this.transferState.set(stateKey, { summary })
    return summary
  }

  private clearServiceTagCache(cloud: ServiceTagCloud, serviceTagId: string): void {
    const cacheKey = `${cloud}/${serviceTagId}`
    this.tagPromises.delete(cacheKey)
    this.allPrefixesTagPromises.delete(cacheKey)
    this.transferState.remove(summaryTransferStateKey(cloud, serviceTagId))
    this.summarySource.clear(cloud, serviceTagId)
  }
}
