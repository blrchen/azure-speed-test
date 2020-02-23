import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./ipRange.component.html",
  styleUrls: ["./ipRange.component.scss"]
})
export class IpRangeComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Datacenter IP Range - Azure Speed Test");
  }
}
