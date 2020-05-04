import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { APIService } from "../../services";
@Component({
  selector: "app-home",
  templateUrl: "./regionFinder.component.html",
  styleUrls: ["./regionFinder.component.scss"]
})
export class RegionFinderComponent implements OnInit {
  ipOrUrl = "";
  result: any = {};

  constructor(private apiService: APIService, private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Cloud Region Finder - Azure Speed Test");
  }

  onSubmit() {
    this.apiService
      .getRegionInfo(this.ipOrUrl)
      .toPromise()
      .then(res => {
        this.result = res;
      });
  }
}
