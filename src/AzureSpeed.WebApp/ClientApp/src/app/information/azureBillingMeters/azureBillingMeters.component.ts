import { Component, OnInit } from "@angular/core";
import data from "../../../assets/data/ratecard.json";

@Component({
  selector: "app-home",
  templateUrl: "./azureBillingMeters.component.html",
  styleUrls: ["./azureBillingMeters.component.scss"],
})
export class AzureBillingMetersComponent implements OnInit {
  tableData: any = [];

  constructor() {}

  ngOnInit() {
    this.tableData = data;
  }
}
