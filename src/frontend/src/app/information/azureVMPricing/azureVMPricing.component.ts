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
      "Azure Virtual Mahcine Pricing - Azure Speed Test"
    );
    this.apiService
      .getAzureVMSlugs()
      .toPromise()
      .then(res => {
        this.tableData = res;
      });
  }
}
