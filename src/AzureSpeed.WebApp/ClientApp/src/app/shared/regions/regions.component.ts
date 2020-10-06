import { Component, OnInit } from "@angular/core";
import { Regions } from "./utils";
import { RegionModel, RegionGroupModel, DefaultRegionsKey } from "../../models";
import { RegionService } from "../../services";

@Component({
  selector: "app-regions",
  templateUrl: "./regions.component.html",
  styleUrls: ["./regions.component.scss"],
})
export class RegionsComponent implements OnInit {
  regionsGroup: RegionGroupModel[] = [];
  totalCheckedRegions = 0;
  ngOnInit() {
    this.initRegions();
  }

  onChange(region: RegionModel, group: RegionGroupModel) {
    if (region) {
      // check region
      const { checked } = region;
      if (checked) {
        let isGroupChecked = true;
        group.regions.forEach((element) => {
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
      const { checked, regions } = group;
      regions.forEach((i) => {
        i.checked = checked;
      });
    }

    const checkedRegions = this.regionsGroup.reduce((arr, item) => {
      const { regions } = item;
      regions.forEach((i) => {
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
    const res = localStorage.getItem(DefaultRegionsKey);
    const defaultRegions: RegionModel[] = res ? JSON.parse(res) : [];
    if (Array.isArray(defaultRegions)) {
      this.regionsGroup.forEach((group) => {
        const { regions } = group;
        let isGroupChecked = true;
        regions.forEach((item) => {
          const { storageAccountName } = item;
          const isDefault = defaultRegions.filter(
            (i) => i.storageAccountName === storageAccountName
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
      const { geography } = item;
      if (!arr.includes(geography)) {
        arr.push(geography);
      }
      return arr;
    }, []);
    this.regionsGroup = groups.reduce((arr, item) => {
      const geography = item;
      const regions = Regions.filter((i) => i.geography === geography).map(
        (i) => ({
          ...i,
          checked: false,
        })
      );
      arr.push({
        geography,
        checked: false,
        regions,
      });
      return arr;
    }, []);
  }
}
