import { BehaviorSubject, Observable } from "rxjs";
import { Injectable } from "@angular/core";

import { DefaultRegionsKey, RegionModel } from "../models";

import { Regions } from "../shared/regions/utils";

@Injectable({
  providedIn: "root",
})
export class RegionService {
  private regionSubject = new BehaviorSubject<RegionModel[]>([]);

  constructor() {
    const res = localStorage.getItem(DefaultRegionsKey);
    // If v1 local storage items found, clear it
    const defaultRegions: RegionModel[] = JSON.parse(res);
    if (defaultRegions && defaultRegions[0]) {
      if (!defaultRegions[0].geography || !defaultRegions[0].regionName) {
        this.clearRegions();
      }
    }
  }

  updateRegions(regions: RegionModel[]) {
    this.regionSubject.next(regions);
    localStorage.setItem(DefaultRegionsKey, JSON.stringify(regions));
  }

  getRegions(): Observable<RegionModel[]> {
    return this.regionSubject.asObservable();
  }

  getAllRegions(): RegionModel[] {
    return Regions;
  }

  clearRegions() {
    this.regionSubject.next(null);
    localStorage.removeItem(DefaultRegionsKey);
  }
}
