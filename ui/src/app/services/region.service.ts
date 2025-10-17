import { Injectable, Signal, signal } from '@angular/core'
import azureGlobalCloudRegionsJson from '../../assets/data/regions.json'
import { RegionModel } from '../models'

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  private readonly selectedRegionsSignal = signal<RegionModel[]>([])
  readonly selectedRegions: Signal<RegionModel[]> = this.selectedRegionsSignal.asReadonly()

  private cachedRegions: RegionModel[] | null = null
  private readonly storagePrefixes = ['s3', 's8', 's9']

  updateSelectedRegions(regions: RegionModel[]) {
    this.selectedRegionsSignal.set(regions)
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
}
