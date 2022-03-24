import { Component, OnInit } from "@angular/core";
import data from "../../../assets/data/ipranges.json";

@Component({
  selector: "app-azure-ip-range",
  templateUrl: "./azureIpRange.component.html",
  styleUrls: ["./azureIpRange.component.scss"],
})
export class AzureIpRangeComponent implements OnInit {
  tableData: any = [];

  ngOnInit() {
    this.tableData = data;
  }
}
