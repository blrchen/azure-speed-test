import { BehaviorSubject } from 'rxjs'
import { Injectable } from '@angular/core'
import { DefaultRegionsKey, RegionModel } from '../models'
import data from '../../assets/data/regions.json'

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  private selectedRegionsSubject = new BehaviorSubject<RegionModel[]>([])
  selectedRegions$ = this.selectedRegionsSubject.asObservable()

  constructor() {
    const res = localStorage.getItem(DefaultRegionsKey)
    // If fetched region items from local storage is not valid, clear it
    try {
      const defaultRegions: RegionModel[] = JSON.parse(res || '[]')
      if (defaultRegions && defaultRegions[0]) {
        if (!defaultRegions[0].geographyGroup || !defaultRegions[0].name) {
          this.clearRegions()
        }
      }
    } catch (e) {
      console.log(e)
      this.clearRegions()
    }
  }

  updateSelectedRegions(regions: RegionModel[]) {
    this.selectedRegionsSubject.next(regions)
    localStorage.setItem(DefaultRegionsKey, JSON.stringify(regions))
  }

  getAllRegions(): RegionModel[] {
    return data
      .filter((region) => !region.restricted && region.geographyGroup !== 'China')
      .map((regionData) => {
        const prefix = ['h3', 's8', 's9'][Math.floor(Math.random() * 3)]
        return {
          ...regionData,
          storageAccountName: `${prefix}${regionData.name}`
        }
      })
  }

  clearRegions() {
    this.selectedRegionsSubject.next([])
    localStorage.removeItem(DefaultRegionsKey)
  }
}
