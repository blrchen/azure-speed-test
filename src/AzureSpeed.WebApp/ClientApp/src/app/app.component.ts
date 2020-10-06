import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { RegionService } from "./services";
import { DefaultRegionsKey } from "./models";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private title: Title,
    private regionService: RegionService
  ) {
    const regions = localStorage.getItem(DefaultRegionsKey);
    this.regionService.updateRegions(regions ? JSON.parse(regions) : []);
  }

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((_) => {
        const title = this.getFromRouteData("title");
        this.title.setTitle(
          (title && `${title} - Azure Speed Test`) || "Azure Speed Test"
        );
      });
  }
  private getFromRouteData(
    name: string,
    routeSnapshot = this.router.routerState.snapshot.root
  ): string {
    let value = (routeSnapshot.data && routeSnapshot.data[name]) || null;
    if (routeSnapshot.firstChild) {
      value = this.getFromRouteData(name, routeSnapshot.firstChild) || value;
    }
    return value;
  }
}
