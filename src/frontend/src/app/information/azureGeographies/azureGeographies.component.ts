import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./azureGeographies.component.html",
  styleUrls: ["./azureGeographies.component.scss"]
})
export class AzureGeographiesComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Azure Geographies - Azure Speed Test");
  }
}
