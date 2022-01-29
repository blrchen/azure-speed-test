import { Component, OnInit } from "@angular/core";
import { Region } from "src/app/models";
import data from "../../../assets/data/regions.json";

@Component({
  selector: "app-home",
  templateUrl: "./azureRegions.component.html",
  styleUrls: ["./azureRegions.component.scss"],
})
export class AzureRegionsComponent implements OnInit {
  tableData: Region[] = [];

  constructor() {}

  ngOnInit() {
    this.tableData = data.sort((a, b) => a.geography.localeCompare(b.geography));
  }
}
