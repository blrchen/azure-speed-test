import { Component, OnInit } from "@angular/core";
import { APIService } from "../../services";

@Component({
  selector: "app-home",
  templateUrl: "./azureBillingMeters.component.html",
  styleUrls: ["./azureBillingMeters.component.scss"],
})
export class AzureBillingMetersComponent implements OnInit {
  message: string;
  tableData: any = [];

  constructor(private apiService: APIService) {}

  ngOnInit() {
    this.message = "Please wait ...";
    this.apiService.getAzureBillingMeters().subscribe((res) => {
      this.message = "";
      this.tableData = res;
    });
  }
}
