import { Component } from "@angular/core";
import { RegionService } from "./services";
import { DefaultRegionsKey } from "./models";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  title = "Azure Speed Test";

  constructor(private regionService: RegionService) {
    const regions = localStorage.getItem(DefaultRegionsKey);
    this.regionService.updateRegions(regions ? JSON.parse(regions) : []);
  }
}
