import { Component, OnInit } from "@angular/core";
import data from "../../../assets/data/geographies.json";

@Component({
  selector: "app-azure-geographies",
  templateUrl: "./azureGeographies.component.html",
  styleUrls: ["./azureGeographies.component.scss"],
})
export class AzureGeographiesComponent implements OnInit {
  tableData: any = [];

  ngOnInit() {
    this.tableData = data;
  }
}
