import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./regionToRegionLatency.component.html",
  styleUrls: ["./regionToRegionLatency.component.scss"]
})
export class RegionToRegionLatencyComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle(
      "Azure Region to Region Latency - Azure Speed Test"
    );
  }
}
