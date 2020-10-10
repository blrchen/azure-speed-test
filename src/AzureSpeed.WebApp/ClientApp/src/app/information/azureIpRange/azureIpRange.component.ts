import { Component, OnInit } from "@angular/core";
import data from "../../../assets/data/ipranges.json";

@Component({
  selector: "app-home",
  templateUrl: "./azureIpRange.component.html",
  styleUrls: ["./azureIpRange.component.scss"],
})
export class AzureIpRangeComponent implements OnInit {
  tableData: any = [];

  constructor() {}

  ngOnInit() {
    this.tableData = data;
  }
}
