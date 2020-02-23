import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./references.component.html",
  styleUrls: ["./references.component.scss"]
})
export class ReferencesComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("References - Azure Speed Test");
  }
}
