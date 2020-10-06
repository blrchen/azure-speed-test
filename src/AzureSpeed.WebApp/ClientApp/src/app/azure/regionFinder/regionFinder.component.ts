import { Component, OnInit } from "@angular/core";
import { APIService } from "../../services";
@Component({
  selector: "app-home",
  templateUrl: "./regionFinder.component.html",
  styleUrls: ["./regionFinder.component.scss"],
})
export class RegionFinderComponent implements OnInit {
  ipOrUrl = "";
  result: any = {};

  constructor(private apiService: APIService) {}

  ngOnInit() {}

  onSubmit() {
    this.apiService.getRegionInfo(this.ipOrUrl).subscribe((res) => {
      this.result = res;
    });
  }
}
