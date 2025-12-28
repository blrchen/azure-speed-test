import { Injectable, Signal, signal } from '@angular/core'

import azureGlobalCloudRegionsJson from '../../assets/data/regions.json'
import { RegionModel } from '../models'

export interface RegionGroup {
  regionGroup: string
  regions: RegionModel[]
}

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  private readonly selectedRegionsState = signal<RegionModel[]>([])
  readonly selectedRegions: Signal<RegionModel[]> = this.selectedRegionsState.asReadonly()

  // Memoization cache
  private cachedRegions: RegionModel[] | null = null
  private cachedRegionGroups: RegionGroup[] | null = null
  private readonly regionCollator = new Intl.Collator('en', { sensitivity: 'base' })
  private readonly storagePrefixes = ['s3', 's8', 'q9']

  updateSelectedRegions(regions: RegionModel[]): void {
    this.selectedRegionsState.set(regions)
  }

  getAllRegions(): RegionModel[] {
    if (this.cachedRegions) {
      return this.cachedRegions
    }

    let prefixIndex = 0
    this.cachedRegions = azureGlobalCloudRegionsJson
      .filter((region) => !region.restricted)
      .map((regionData) => {
        const prefix = this.storagePrefixes[prefixIndex % this.storagePrefixes.length]
        prefixIndex += 1
        return {
          ...regionData,
          storageAccountName: `${prefix}${regionData.regionId}`
        }
      })

    return this.cachedRegions
  }

  getRegionGroups(): RegionGroup[] {
    if (this.cachedRegionGroups) {
      return this.cachedRegionGroups
    }

    const groupsByName = new Map<string, RegionModel[]>()

    for (const region of this.getAllRegions()) {
      const key = region.regionGroup
      if (!key) continue

      const group = groupsByName.get(key)
      if (group) {
        group.push(region)
      } else {
        groupsByName.set(key, [region])
      }
    }

    const collator = this.regionCollator
    this.cachedRegionGroups = Array.from(groupsByName.entries())
      .map(([regionGroup, groupedRegions]) => ({
        regionGroup,
        regions: [...groupedRegions].sort((a, b) => collator.compare(a.displayName, b.displayName))
      }))
      .sort((a, b) => b.regions.length - a.regions.length)

    return this.cachedRegionGroups
  }
}
