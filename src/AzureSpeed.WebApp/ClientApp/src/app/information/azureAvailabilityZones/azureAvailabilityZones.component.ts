import { Component, OnInit } from "@angular/core";
import { RegionModel } from "src/app/models";
import data from "../../../assets/data/regions.json";

@Component({
  selector: "app-home",
  templateUrl: "./azureAvailabilityZones.component.html",
  styleUrls: ["./azureAvailabilityZones.component.scss"],
})
export class AzureAvailabilityZonesComponent implements OnInit {
  tableData: RegionModel[] = [];

  constructor() {}

  ngOnInit() {
    this.tableData = data.filter((region) => {
      return region.availabilityZoneCount > 0;
    });
  }
}
