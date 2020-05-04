import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { APIService } from "../../services";

@Component({
  selector: "app-home",
  templateUrl: "./ipRange.component.html",
  styleUrls: ["./ipRange.component.scss"]
})
export class IpRangeComponent implements OnInit {
  tableData = [];

  constructor(private apiService: APIService, private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Datacenter IP Range - Azure Speed Test");
    this.apiService
      .getIpRange()
      .toPromise()
      .then(res => {
        this.tableData = res;
      });
  }
}
