import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-home",
  templateUrl: "./azureEnvironments.component.html",
  styleUrls: ["./azureEnvironments.component.scss"]
})
export class AzureEnvironmentsComponent implements OnInit {
  constructor(private titleService: Title) {}

  ngOnInit() {
    this.titleService.setTitle("Azure Environments - Azure Speed Test");
  }
}
