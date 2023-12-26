import { BehaviorSubject, Observable } from 'rxjs'
import { Injectable } from '@angular/core'
import { DefaultRegionsKey, RegionModel } from '../models'
import data from '../../assets/data/regions.json'

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  private regionSubject = new BehaviorSubject<RegionModel[]>([])

  constructor() {
    const res = localStorage.getItem(DefaultRegionsKey)
    // If fetched region items from local storage is not valid, clear it
    try {
      const defaultRegions: RegionModel[] = JSON.parse(res)
      if (defaultRegions && defaultRegions[0]) {
        if (
          !defaultRegions[0].geography ||
          !defaultRegions[0].regionName ||
          !defaultRegions[0].storageAccountName.startsWith('a1')
        ) {
          this.clearRegions()
        }
      }
    } catch (e) {
      this.clearRegions()
    }
  }

  updateRegions(regions: RegionModel[]) {
    this.regionSubject.next(regions)
    localStorage.setItem(DefaultRegionsKey, JSON.stringify(regions))
  }

  getRegions(): Observable<RegionModel[]> {
    return this.regionSubject.asObservable()
  }

  getAllRegions(): RegionModel[] {
    return data
      .filter((region) => !region.restricted)
      .map((regionData) => {
        const prefix =
          regionData.geography === 'China'
            ? `ast`
            : Math.floor(Math.random() * 2) === 0
              ? 's1'
              : 's2'
        return {
          ...regionData,
          storageAccountName: `${prefix}${regionData.regionName}`
        }
      })
  }

  clearRegions() {
    this.regionSubject.next(null)
    localStorage.removeItem(DefaultRegionsKey)
  }
}
