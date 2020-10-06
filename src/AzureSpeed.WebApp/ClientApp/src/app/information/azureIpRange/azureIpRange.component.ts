import { Component, OnInit } from "@angular/core";
import { APIService } from "../../services";

@Component({
  selector: "app-home",
  templateUrl: "./azureIpRange.component.html",
  styleUrls: ["./azureIpRange.component.scss"],
})
export class AzureIpRangeComponent implements OnInit {
  message: string;
  tableData: any = [];

  constructor(private apiService: APIService) {}

  ngOnInit() {
    this.message = "Please wait ...";
    this.apiService.getIpRange().subscribe((res) => {
      this.message = "";
      this.tableData = res;
    });
  }
}
