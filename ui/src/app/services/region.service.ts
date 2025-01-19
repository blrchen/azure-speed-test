import { BehaviorSubject } from 'rxjs'
import { Injectable } from '@angular/core'
import publicRegionsJson from '../../assets/data/regions.json'
import { RegionModel } from '../models'

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  private selectedRegionsSubject = new BehaviorSubject<RegionModel[]>([])
  selectedRegions$ = this.selectedRegionsSubject.asObservable()

  updateSelectedRegions(regions: RegionModel[]) {
    this.selectedRegionsSubject.next(regions)
  }

  getAllRegions(): RegionModel[] {
    return publicRegionsJson
      .filter((region) => !region.restricted)
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
  }
}
