import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { APIService } from "../../services";
@Component({
  selector: "app-home",
  templateUrl: "./ipLookup.component.html",
  styleUrls: ["./ipLookup.component.scss"]
})
export class IPLookupComponent implements OnInit {
  ipAddressOrUrl = "";
  result: any = {};

  constructor(private apiService: APIService, private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Azure IP Lookup - Azure Speed Test");
  }

  onSubmit() {
    this.apiService
      .getIPInfo(this.ipAddressOrUrl)
      .toPromise()
      .then(res => {
        this.result = res;
      });
  }
}
