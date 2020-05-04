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
  regionsGroup: RegionGroupModel[] = [];
  totalCheckedRegions = 0;
  ngOnInit() {
    this.initRegions();
  }

  onChange(region, group) {
    if (region) {
      // check region
      const { checked } = region;
      if (checked) {
        let isGroupChecked = true;
        group.locations.forEach(element => {
          if (!element.checked) {
            isGroupChecked = false;
          }
        });
        group.checked = isGroupChecked;
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

    const checkedRegions = this.regionsGroup.reduce((arr, item) => {
      const { locations } = item;
      locations.forEach(i => {
        if (i.checked) {
          arr.push(i);
        }
      });
      this.totalCheckedRegions = arr.length;
      return arr;
    }, []);

    this.regionService.updateRegions(checkedRegions);
  }

  initRegions() {
    // init region checked status from local storage, key = azurespeed.userSelectedRegions
    //
    const res = localStorage.getItem(DefaultRegionsKey);
    const defaultRegions: RegionModel = res ? JSON.parse(res) : [];
    if (Array.isArray(defaultRegions)) {
      this.regionsGroup.forEach(group => {
        const { locations } = group;
        let isGroupChecked = true;
        locations.forEach(item => {
          const { storageAccountName } = item;
          const isDefault = defaultRegions.filter(
            i => i.storageAccountName === storageAccountName
          );
          if (isDefault.length > 0) {
            item.checked = true;
            this.totalCheckedRegions += 1;
          }
          // If any item is found un-checked, group must be un-checked as well
          if (!item.checked) {
            isGroupChecked = false;
          }
        });
        group.checked = isGroupChecked;
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
