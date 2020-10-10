import { Component, OnInit } from "@angular/core";
import data from "../../../assets/data/vmpricing.json";

@Component({
  selector: "app-home",
  templateUrl: "./azureVMPricing.component.html",
  styleUrls: ["./azureVMPricing.component.scss"],
})
export class AzureVMPricingComponent implements OnInit {
  tableData: any = [];

  constructor() {}

  ngOnInit() {
    this.tableData = data;
  }
}
