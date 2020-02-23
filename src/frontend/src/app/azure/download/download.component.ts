import { Component, OnInit, OnDestroy } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Subscription } from "rxjs";
import { APIService, RegionService } from "../../services";
import { RegionModel } from "../../models";

@Component({
  selector: "app-home",
  templateUrl: "./download.component.html",
  styleUrls: ["./download.component.scss"]
})
export class DownloadComponent implements OnInit, OnDestroy {
  tableData = [];
  subs: Subscription[] = [];
  regions: RegionModel[] = [];

  constructor(
    private apiService: APIService,
    private regionService: RegionService,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.titleService.setTitle(
      "Azure Storage Blob Download Speed Test - Azure Speed Test"
    );
    const sub = this.regionService.getRegions().subscribe(res => {
      this.regions = res || [];
      this.tableData = res || [];
      this.regions.forEach((item, index) => {
        this.getDoanloadUrl(item, index);
      });
    });
    this.subs.push(sub);
  }

  getDoanloadUrl(region: RegionModel, index) {
    const { locationId } = region;
    const blobName = "100MB.bin";
    this.apiService
      .getUploadUrl(blobName, locationId, "download")
      .toPromise()
      .then(res => {
        const url = res.url || "";
        if (url) {
          this.tableData[index].url = url;
        }
      });
  }

  ngOnDestroy() {
    this.subs.forEach(sub => {
      if (sub) {
        sub.unsubscribe();
      }
    });
  }
}
