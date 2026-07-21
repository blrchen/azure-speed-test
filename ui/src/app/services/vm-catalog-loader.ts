import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import {
  VM_CATALOG_DIRECTORY_ASSET_PATH,
  VM_CATALOG_FAMILIES_ASSET_PATH,
  VM_CATALOG_REGIONS_ASSET_PATH,
  VmCatalogDocument,
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
    return this.load(VM_CATALOG_DIRECTORY_ASSET_PATH)
  }

  getRegions(): Promise<VmRegionsDocument> {
    return this.load(VM_CATALOG_REGIONS_ASSET_PATH)
  }

  getSeries(): Promise<VmFamiliesDocument> {
    return this.load(VM_CATALOG_FAMILIES_ASSET_PATH)
  }

  async getSkuDetail(skuName: string): Promise<VmSkuDetailDocument | null> {
    const skuKey = skuName.trim().toLowerCase()
    const [asset, regionDirectory] = await Promise.all([
      this.loadOptional<VmSkuDetailAssetDocument>(vmSkuAssetPath(skuKey)),
      this.getRegions(),
    ])
    if (!asset) return null

    const regionsByName = new Map(
      regionDirectory.regions.map((region) => [region.armRegionName, region])
    )
    return {
      source: asset.source,
      counts: asset.counts,
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
    return this.loadOptional(vmSeriesAssetPath(normalizedSlug))
  }

  getRegionDetail(armRegionName: string): Promise<VmRegionDetailDocument | null> {
    return this.loadOptional(vmRegionAssetPath(armRegionName.trim().toLowerCase()))
  }

  private load<T>(path: string): Promise<T> {
    const cached = this.documentPromises.get(path)
    if (cached) return cached as Promise<T>

    const request = firstValueFrom(this.http.get<T>(path, VM_CATALOG_HTTP_OPTIONS)).catch(
      (error) => {
        this.documentPromises.delete(path)
        throw error
      }
    )
    this.documentPromises.set(path, request)
    return request
  }

  private loadOptional<T>(path: string): Promise<T | null> {
    const cached = this.documentPromises.get(path)
    if (cached) return cached as Promise<T | null>

    const request = firstValueFrom(this.http.get<T>(path, VM_CATALOG_HTTP_OPTIONS)).catch(
      (error) => {
        if (isHttpNotFound(error)) return null
        this.documentPromises.delete(path)
        throw error
      }
    )
    this.documentPromises.set(path, request)
    return request
  }
}
