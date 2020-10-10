import { Component, OnInit } from "@angular/core";
import data from "../../../assets/data/geographies.json";

@Component({
  selector: "app-home",
  templateUrl: "./azureGeographies.component.html",
  styleUrls: ["./azureGeographies.component.scss"],
})
export class AzureGeographiesComponent implements OnInit {
  tableData: any = [];

  constructor() {}

  ngOnInit() {
    this.tableData = data;
  }
}
