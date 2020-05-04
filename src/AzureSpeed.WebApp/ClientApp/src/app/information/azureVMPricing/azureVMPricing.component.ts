import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { APIService } from "../../services";

@Component({
  selector: "app-home",
  templateUrl: "./azureVMPricing.component.html",
  styleUrls: ["./azureVMPricing.component.scss"]
})
export class AzureVMPricingComponent implements OnInit {
  tableData = [];

  constructor(private apiService: APIService, private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle(
      "Azure Virtual Machine Pricing - Azure Speed Test"
    );
    this.apiService
      .getAzureVMPrices()
      .toPromise()
      .then(res => {
        this.tableData = res;
      });
  }
}
