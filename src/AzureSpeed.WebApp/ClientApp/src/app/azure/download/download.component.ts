import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { APIService, RegionService } from "../../services";
import { RegionModel } from "../../models";

@Component({
  selector: "app-home",
  templateUrl: "./download.component.html",
  styleUrls: ["./download.component.scss"],
})
export class DownloadComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];
  tableData: RegionModel[] = [];
  regions: RegionModel[] = [];

  constructor(
    private apiService: APIService,
    private regionService: RegionService
  ) {}

  ngOnInit() {
    const sub = this.regionService.getRegions().subscribe((res) => {
      this.regions = res || [];
      this.tableData = res || [];
      this.regions.forEach((item, index) => {
        this.getDownloadUrl(item, index);
      });
    });
    this.subs.push(sub);
  }

  getDownloadUrl(region: RegionModel, index: number) {
    const { regionName } = region;
    const blobName = "100MB.bin";
    const sub = this.apiService
      .getSasUrl(regionName, blobName, "download")
      .subscribe((res) => {
        const url = res.url || "";
        if (url) {
          this.tableData[index].url = url;
        }
      });
    this.subs.push(sub);
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => {
      if (sub) {
        sub.unsubscribe();
      }
    });
  }
}
