import { Component, OnInit, OnDestroy } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Subscription } from "rxjs";
import {
  APIService,
  RegionService,
  StorageService,
  UtilsService
} from "../../services";
import { RegionModel } from "../../models";

@Component({
  selector: "app-upload",
  templateUrl: "./upload.component.html",
  styleUrls: ["./upload.component.scss"]
})
export class UploadComponent implements OnInit, OnDestroy {
  tableData = [];
  historyData = {};
  subs: Subscription[] = [];
  regions: RegionModel[] = [];
  count = 0;

  constructor(
    private apiService: APIService,
    private regionService: RegionService,
    private storageService: StorageService,
    private titleService: Title,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.titleService.setTitle(
      "Azure Storage Blob Upload Speed Test - Azure Speed Test"
    );
    const sub = this.regionService.getRegions().subscribe(res => {
      this.regions = res || [];
    });
    this.subs.push(sub);
  }

  onStartTest() {
    this.tableData = [];
    const region = this.regions[this.count] || "";
    if (region) {
      this.getSASUrl(region);
    }
  }

  getSASUrl(region: RegionModel) {
    const { locationId } = region;
    this.apiService
      .getUploadUrl(this.utilsService.getRandomBlobName(), locationId)
      .toPromise()
      .then(res => {
        const url = res.url || "";
        if (url) {
          this.uploadBlob(url, region);
        }
      });
  }

  uploadBlob(url, region: RegionModel) {
    // Geography Region Location
    const { geography, name, location, storageAccountName } = region;
    const sasUrl = this.utilsService.splitUrl(url);
    const client = this.storageService.createBlobServiceClient(sasUrl);
    const blockId = btoa("block-00000").replace(/=/g, "a");
    const blockBlob = client
      .getContainerClient("upload")
      .getBlockBlobClient(sasUrl.blobName);
    const sizeBytes = 3 * 1024 * 1024; // 3MB
    const uploadStartTime = new Date().getTime();
    blockBlob
      .stageBlock(blockId, this.fileArrayBlob(sizeBytes), sizeBytes, {
        onProgress: ({ loadedBytes }) => {
          // console.log(loadedBytes)
          const progress = `${((loadedBytes / sizeBytes) * 100).toFixed(0)}%`;
          const totalTime = (new Date().getTime() - uploadStartTime) / 1000;
          const speed = `${this.utilsService.getSizeStr(
            sizeBytes / totalTime
          )}/s`;

          // console.log(progress, speed)
          this.historyData[storageAccountName] = {
            storageAccountName,
            geography,
            region: name,
            location,
            progress,
            speed
          };

          let index = -1;
          this.tableData.forEach(({ storageAccountName: account2 }, i) => {
            if (storageAccountName === account2) {
              index = i;
            }
          });

          if (index > -1) {
            this.tableData.splice(
              index,
              1,
              this.historyData[storageAccountName]
            );
          } else {
            this.tableData.push(this.historyData[storageAccountName]);
          }
        }
      })
      .then(r => {
        // console.log(r)
        blockBlob.commitBlockList([blockId]).then(res => {
          // console.log(res)
          // console.log(this.tableData)
          this.count++;
          const nextRegion = this.regions[this.count];
          if (nextRegion) {
            this.getSASUrl(nextRegion);
          } else {
            this.count = 0;
          }
        });
      });
  }

  fileArrayBlob(size = 0): Blob {
    const array = Array.from({ length: size }, () => ".");
    return new Blob(array);
  }

  ngOnDestroy() {
    this.subs.forEach(sub => {
      if (sub) {
        sub.unsubscribe();
      }
    });
  }
}
