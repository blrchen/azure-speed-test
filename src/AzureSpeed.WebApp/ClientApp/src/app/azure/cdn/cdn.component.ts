import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./cdn.component.html",
  styleUrls: ["./cdn.component.scss"]
})
export class CDNComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Azure CDN Speed Test - Azure Speed Test");
  }
}
