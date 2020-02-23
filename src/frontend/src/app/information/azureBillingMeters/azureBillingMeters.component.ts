import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { APIService } from "../../services";

@Component({
  selector: "app-home",
  templateUrl: "./azureBillingMeters.component.html",
  styleUrls: ["./azureBillingMeters.component.scss"]
})
export class AzureBillingMetersComponent implements OnInit {
  tableData = [];

  constructor(private apiService: APIService, private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Azure Billing Meters - Azure Speed Test");
    this.apiService
      .getAzureBillingMeters()
      .toPromise()
      .then(res => {
        this.tableData = res;
      });
  }
}
