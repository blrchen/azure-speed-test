import { Service, signal } from '@angular/core'

import azureGlobalCloudRegionsJson from '../../assets/data/regions.json'
import { RegionModel } from '../models'
import { REGION_NAME_COLLATOR } from '../shared/utils'

export interface RegionGroup {
  readonly regionGroup: string
  readonly regions: readonly RegionModel[]
}

@Service()
export class RegionService {
  private readonly selectedRegionsState = signal<readonly RegionModel[]>([])
  readonly selectedRegions = this.selectedRegionsState.asReadonly()

  private cachedRegions: readonly RegionModel[] | null = null
  private cachedRegionGroups: readonly RegionGroup[] | null = null
  private readonly regionCollator = REGION_NAME_COLLATOR
  private readonly storagePrefix = 's8'

  updateSelectedRegions(regions: readonly RegionModel[]): void {
    this.selectedRegionsState.set([...regions])
  }

  getAllRegions(): readonly RegionModel[] {
    if (this.cachedRegions) return [...this.cachedRegions]

    this.cachedRegions = Object.freeze(
      azureGlobalCloudRegionsJson
        .filter((region) => !region.restricted)
        .map((regionData) =>
          Object.freeze({
            ...regionData,
            storageAccountName: `${this.storagePrefix}${regionData.regionId}`,
          })
        )
    )

    return [...this.cachedRegions]
  }

  getRegionGroups(): readonly RegionGroup[] {
    if (this.cachedRegionGroups) return [...this.cachedRegionGroups]

    const groups = new Map<string, RegionModel[]>()
    for (const region of this.getAllRegions()) {
      const key = region.regionGroup
      if (!key) continue
      const existing = groups.get(key)
      if (existing) existing.push(region)
      else groups.set(key, [region])
    }

    this.cachedRegionGroups = Object.freeze(
      [...groups.entries()]
        .map(([regionGroup, regions]) =>
          Object.freeze({
            regionGroup,
            regions: Object.freeze(
              [...regions].sort((a, b) => this.regionCollator.compare(a.displayName, b.displayName))
            ),
          })
        )
        .sort((a, b) => b.regions.length - a.regions.length)
    )

    return [...this.cachedRegionGroups]
  }
}
