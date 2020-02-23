import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./regionFinder.component.html",
  styleUrls: ["./regionFinder.component.scss"]
})
export class RegionFinderComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Cloud Region Finder - Azure Speed Test");
  }
}
