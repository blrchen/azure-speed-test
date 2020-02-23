import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./azureRegions.component.html",
  styleUrls: ["./azureRegions.component.scss"]
})
export class AzureRegionsComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Azure Regions - Azure Speed Test");
  }
}
