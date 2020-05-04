import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./azureSovereignClouds.component.html",
  styleUrls: ["./azureSovereignClouds.component.scss"]
})
export class AzureSovereignCloudsComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Azure Sovereign Clouds - Azure Speed Test");
  }
}
