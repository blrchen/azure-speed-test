import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import {
  VM_CATALOG_DIRECTORY_ASSET_PATH,
  VM_CATALOG_FAMILIES_ASSET_PATH,
  VM_CATALOG_MANIFEST_ASSET_PATH,
  VM_CATALOG_REGIONS_ASSET_PATH,
  VmCatalogContext,
  VmCatalogDocument,
  VmCatalogMetadata,
  VmFamiliesDocument,
  VmFamilyDetailDocument,
  vmRegionAssetPath,
  VmRegionDetailDocument,
  VmRegionsDocument,
  vmSeriesAssetPath,
  vmSkuAssetPath,
  VmSkuDetailAssetDocument,
  VmSkuDetailDocument,
} from './vm-catalog'

const VM_CATALOG_HTTP_OPTIONS = { transferCache: false } as const

function isHttpNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404
}

@Service()
export class VmCatalogLoader {
  private readonly http = inject(HttpClient)
  private readonly documentPromises = new Map<string, Promise<unknown>>()

  getDirectory(): Promise<VmCatalogDocument> {
    return this.loadCatalogDocument(VM_CATALOG_DIRECTORY_ASSET_PATH)
  }

  getRegions(): Promise<VmRegionsDocument> {
    return this.loadCatalogDocument(VM_CATALOG_REGIONS_ASSET_PATH)
  }

  getSeries(): Promise<VmFamiliesDocument> {
    return this.loadCatalogDocument(VM_CATALOG_FAMILIES_ASSET_PATH)
  }

  async getSkuDetail(skuName: string): Promise<VmSkuDetailDocument | null> {
    const skuKey = skuName.trim().toLowerCase()
    const [asset, regionDirectory] = await Promise.all([
      this.loadOptionalCatalogDocument<VmSkuDetailAssetDocument>(vmSkuAssetPath(skuKey)),
      this.getRegions(),
    ])
    if (!asset) return null

    const regionsByName = new Map(
      regionDirectory.regions.map((region) => [region.armRegionName, region])
    )
    return {
      source: asset.source,
      sku: asset.sku,
      familySummary: asset.familySummary,
      regions: asset.sku.observedLocations.map((regionName) => regionsByName.get(regionName)!),
      prices: asset.prices.map((price) => ({
        ...price,
        region: regionsByName.get(price.armRegionName)!,
      })),
    }
  }

  getSeriesDetail(seriesSlug: string): Promise<VmFamilyDetailDocument | null> {
    const normalizedSlug = seriesSlug.trim().toLowerCase()
    return this.loadOptionalCatalogDocument(vmSeriesAssetPath(normalizedSlug))
  }

  getRegionDetail(armRegionName: string): Promise<VmRegionDetailDocument | null> {
    return this.loadOptionalCatalogDocument(vmRegionAssetPath(armRegionName.trim().toLowerCase()))
  }

  private async getMetadata(): Promise<VmCatalogMetadata> {
    const manifest = await this.load<VmCatalogContext>(VM_CATALOG_MANIFEST_ASSET_PATH)
    return { source: manifest.source }
  }

  private async loadCatalogDocument<T extends object>(path: string): Promise<T> {
    const [document, metadata] = await Promise.all([this.load<T>(path), this.getMetadata()])
    return { ...document, ...metadata }
  }

  private async loadOptionalCatalogDocument<T extends object>(path: string): Promise<T | null> {
    const [document, metadata] = await Promise.all([this.loadOptional<T>(path), this.getMetadata()])
    return document ? { ...document, ...metadata } : null
  }

  private load<T>(path: string): Promise<T> {
    return this.requestDocument<T>(path, false)
  }

  private loadOptional<T>(path: string): Promise<T | null> {
    return this.requestDocument<T>(path, true)
  }

  /**
   * Shares one in-flight promise per asset path and evicts the entry on
   * failure so a later call can retry. Only optional loads turn a 404 into
   * `null`; every other failure rejects, as do 404s on required assets.
   */
  private requestDocument<T>(path: string, allowNotFound: false): Promise<T>
  private requestDocument<T>(path: string, allowNotFound: true): Promise<T | null>
  private requestDocument<T>(path: string, allowNotFound: boolean): Promise<T | null> {
    const cached = this.documentPromises.get(path)
    if (cached) return cached as Promise<T | null>

    const request = firstValueFrom(this.http.get<T>(path, VM_CATALOG_HTTP_OPTIONS)).catch(
      (error): T | null => {
        this.documentPromises.delete(path)
        if (allowNotFound && isHttpNotFound(error)) return null
        throw error
      }
    )
    this.documentPromises.set(path, request)
    return request
  }
}
