import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./azureAvailabilityZones.component.html",
  styleUrls: ["./azureAvailabilityZones.component.scss"]
})
export class AzureAvailabilityZonesComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Azure Availability Zones - Azure Speed Test");
  }
}
