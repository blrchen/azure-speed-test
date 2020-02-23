import { Component, Input, OnInit } from "@angular/core";
import { Regions } from "./utils";
import { RegionModel, RegionGroupModel, DefaultRegionsKey } from "../../models";

import { RegionService } from "../../services";

@Component({
  selector: "app-regions",
  templateUrl: "./regions.component.html",
  styleUrls: ["./regions.component.scss"]
})
export class RegionsComponent implements OnInit {
  @Input() checkedItems = [];

  regionsGroup: RegionGroupModel[] = [];

  ngOnInit() {
    this.initRegions();
  }

  onChange(region, group) {
    if (region) {
      // check region
      const { checked } = region;
      if (checked) {
        let checkedCache = true;
        group.locations.forEach(element => {
          if (!element.checked) {
            checkedCache = false;
          }
        });
        group.checked = checkedCache;
      } else {
        group.checked = false;
      }
    } else {
      // check group
      const { checked, locations } = group;
      locations.forEach(i => {
        i.checked = checked;
      });
    }

    // console.log(region, group)

    const checkedRegions = this.regionsGroup.reduce((arr, item) => {
      const { locations } = item;
      locations.forEach(i => {
        if (i.checked) {
          arr.push(i);
        }
      });
      return arr;
    }, []);

    // storage
    // localStorage.setItem(DefaultRegionsKey, JSON.stringify(checkedRegions));
    this.regionService.updateRegions(checkedRegions);
  }

  initRegions() {
    // init region checked status from localstorage
    // azurespeed.userSelectedRegions
    const res = localStorage.getItem(DefaultRegionsKey);
    const defaultRegions: RegionModel = res ? JSON.parse(res) : [];
    if (Array.isArray(defaultRegions)) {
      this.regionsGroup.forEach(group => {
        const { locations } = group;
        let checkedCache = true;
        locations.forEach(item => {
          const { locationId, id, storageAccountName } = item;
          const isDefault = defaultRegions.filter(
            i => i.storageAccountName === storageAccountName
          );
          if (isDefault.length > 0) {
            item.checked = true;
          }
          if (!item.checked) {
            checkedCache = false;
          }
        });
        group.checked = checkedCache;
      });
    }
  }

  constructor(private regionService: RegionService) {
    const groups = Regions.reduce((arr, item) => {
      const { geographyGrouping } = item;
      if (!arr.includes(geographyGrouping)) {
        arr.push(geographyGrouping);
      }
      return arr;
    }, []);
    // console.log(groups)
    this.regionsGroup = groups.reduce((arr, item) => {
      const geographyGrouping = item;
      const locations = Regions.filter(
        i => i.geographyGrouping === geographyGrouping
      ).map(i => ({
        ...i,
        checked: false
      }));
      arr.push({
        geographyGrouping,
        checked: false,
        locations
      });
      return arr;
    }, []);

    // console.log(this.regionsGroup)
  }
}
