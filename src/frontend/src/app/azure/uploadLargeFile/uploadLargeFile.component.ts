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
    if (!this.region || !this.file) {
      alert("no region or file");
      return;
    }
    const blobName = this.utilsService.getRandomBlobName();
    const locationId = this.region;
    const file = this.file;

    this.apiService.getUploadUrl(blobName, locationId).subscribe(res => {
      const url = res.url || "";
      const sasUrl = this.utilsService.splitUrl(url);
      const client = this.storageService.createBlobServiceClient(sasUrl);
      const blockId = btoa("block-00000").replace(/=/g, "a");
      const blockBlob = client
        .getContainerClient("upload")
        .getBlockBlobClient(sasUrl.blobName);
      const uploadStartTime = new Date().getTime();
      this.uploadProgress = "";
      this.uploadTime = "";
      console.log("blockSize", this.blockSize);
      console.log("concurrency", this.thread);
      blockBlob
        .uploadBrowserData(file, {
          blockSize: this.blockSize * 1024, // * 1024 to convert to bytes
          // TODO: use maxSingleShotSize for muti-thread block blob upload
          concurrency: this.thread,
          onProgress: ({ loadedBytes }) => {
            this.uploadProgress = `${(
              (loadedBytes / this.file.size) *
              100
            ).toFixed(0)}%`;
          }
        })
        .then(
          () => {
            const totalTime = (new Date().getTime() - uploadStartTime) / 1000;
            const speed = `${this.utilsService.getSizeStr(
              this.file.size / totalTime
            )}/s`;
            this.uploadFileName = this.file.name;
            this.uploadFileSize = this.utilsService.getSizeStr(this.file.size);
            this.uploadTime = `${totalTime} s`;
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
          },
          () => {
            // TODO: handle upload error
          }
        );
    });
  }

  onUploadComplete() {}

  onCancel() {
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
