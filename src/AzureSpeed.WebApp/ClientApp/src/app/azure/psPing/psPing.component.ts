import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./psPing.component.html",
  styleUrls: ["./psPing.component.scss"]
})
export class PSPingComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle(
      "PsPing Network Latency Test - Azure Speed Test"
    );
  }
}
