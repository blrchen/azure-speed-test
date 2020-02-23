import {
  Component,
  TemplateRef,
  ViewChild,
  OnInit,
  OnDestroy
} from "@angular/core";
import { Title } from "@angular/platform-browser";
import {
  NgbModal,
  ModalDismissReasons,
  NgbModalRef
} from "@ng-bootstrap/ng-bootstrap";
import {
  RegionService,
  APIService,
  UtilsService,
  StorageService
} from "../../services";
import { Subscription } from "rxjs";
import { RegionModel } from "src/app/models";

@Component({
  selector: "app-upload-large-file",
  templateUrl: "./uploadLargeFile.component.html",
  styleUrls: ["./uploadLargeFile.component.scss"]
})
export class UploadLargeFileComponent implements OnInit, OnDestroy {
  tableData = [];

  uploadProgress = "";
  uploadFileName = "";
  uploadFileSize = "";
  uploadTime = "";
  uploadSpeed = "";

  file: any = "";
  region = "";
  blockSize = 4096;
  thread = 4;

  regions: RegionModel[] = [];
  blockSizes = [256, 512, 1024, 4096];
  threads = [1, 2, 4, 8, 16];

  modalRef: NgbModalRef;
  @ViewChild("uploadModal", { static: true }) modalTpl: TemplateRef<any>;

  subs: Subscription[] = [];

  constructor(
    private modalService: NgbModal,
    private regionService: RegionService,
    private apiService: APIService,
    private utilsService: UtilsService,
    private storageService: StorageService,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.titleService.setTitle(
      "Azure Storage Large File Upload Speed Test - Azure Speed Test"
    );
    this.regions = this.regionService.getAllRegions();
  }

  onChangeFile($event) {
    console.log($event.target.files[0]);
    this.file = $event.target.files[0] || "";
  }

  onOpen() {
    this.modalRef = this.modalService.open(this.modalTpl, {
      size: "",
      centered: true,
      backdrop: "static",
      windowClass: "modal-md"
    });
  }

  onSubmit() {
    console.log(this.region, this.file, this.thread, this.blockSize);
    if (!this.region || !this.file) {
      alert("no region or file");
      return;
    }
    const blobName = this.utilsService.newGuid();
    const locationId = this.region;
    const file = this.file;
    const size = this.blockSize;

    this.apiService.getUploadUrl(blobName, locationId).subscribe(res => {
      const url = res.url || "";
      const sasUrl = this.utilsService.splitUrl(url);
      const client = this.storageService.createBlobServieClient(sasUrl);
      const blockId = btoa("block-00000").replace(/=/g, "a");
      const blockBlob = client
        .getContainerClient("upload")
        .getBlockBlobClient(sasUrl.blobName);
      const t1 = new Date().getTime();
      this.uploadProgress = "";
      this.uploadTime = "";
      blockBlob
        .uploadBrowserData(file, {
          blockSize: this.blockSize,
          // maxSingleShotSize: 1,
          concurrency: this.thread,
          onProgress: ({ loadedBytes }) => {
            this.uploadProgress = `${(
              (loadedBytes / this.file.size) *
              100
            ).toFixed(0)}%`;
          }
        })
        .then(() => {
          const t2 = (new Date().getTime() - t1) / 1000;
          const speed = `${this.utilsService.getSizeStr(
            this.file.size / t2
          )}/s`;
          this.uploadFileName = this.file.name;
          this.uploadFileSize = this.utilsService.getSizeStr(this.file.size);
          this.uploadTime = `${t2} s`;
          this.uploadSpeed = speed;

          const regionObj = this.regions.filter(
            ({ locationId: id }) => id === this.region
          );

          const data = {
            fileName: this.file.name,
            fileSize: this.utilsService.getSizeStr(this.file.size),
            region: regionObj[0].name,
            thread: this.thread,
            blockSize: this.blockSize,
            uploadSpeed: speed
          };
          this.tableData.push(data);
        });
      /* blockBlob.stageBlock(
        blockId,
        this.file,
        size, {
        onProgress: ({ loadedBytes }) => {
          // console.log(loadedBytes)
          const progress = `${((loadedBytes / this.file.size) * 100).toFixed(0)}%`;
          // console.log(progress, speed)
          this.uploadProgress = progress;
        }
      }
      ).then(r => {
        // console.log(r)
        blockBlob.commitBlockList([blockId]).then(res => {
          const t2 = (new Date().getTime() - t1) / 1000;
          const speed = `${this.utilsService.getSizeStr(this.file.size / t2)}/s`;
          this.uploadFileName = this.file.name;
          this.uploadFileSize = this.utilsService.getSizeStr(this.file.size);
          this.uploadTime = `${t2} s`;
          this.uploadSpeed = speed;

          const regionObj = this.regions.filter(({ locationId }) => locationId === this.region);

          const data = {
            fileName: this.file.name,
            fileSize: this.utilsService.getSizeStr(this.file.size),
            region: regionObj[0].name,
            thread: this.thread,
            blockSize: this.blockSize,
            uploadSpeed: speed
          }
          this.tableData.push(data);
        });
      }); */
    });
  }

  onCancle() {
    this.modalRef.dismiss();
  }

  ngOnDestroy() {
    this.subs.forEach(sub => {
      if (sub) {
        sub.unsubscribe();
      }
    });
  }
}
