import { Component, OnInit } from "@angular/core";
import { APIService } from "../../services";

@Component({
  selector: "app-home",
  templateUrl: "./azureVMPricing.component.html",
  styleUrls: ["./azureVMPricing.component.scss"],
})
export class AzureVMPricingComponent implements OnInit {
  message: string;
  tableData: any = [];

  constructor(private apiService: APIService) {}

  ngOnInit() {
    this.message = "Please wait ...";
    this.apiService.getAzureVMPrices().subscribe((res) => {
      this.message = "";
      this.tableData = res;
    });
  }
}
