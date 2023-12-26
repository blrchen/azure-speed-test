import { Component, TemplateRef, ViewChild, OnInit, OnDestroy } from '@angular/core'
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap'
import { Subscription } from 'rxjs'
import { RegionModel } from 'src/app/models'
import { RegionService, APIService, UtilsService, StorageService } from '../../services'

interface BlobUploadSpeedModel {
  fileName: string
  fileSize: string
  region: string
  thread: number
  blockSize: number
  uploadSpeed: string
}

@Component({
  selector: 'app-upload-large-file',
  templateUrl: './uploadLargeFile.component.html'
})
export class UploadLargeFileComponent implements OnInit, OnDestroy {
  subs: Subscription[] = []
  tableData: BlobUploadSpeedModel[] = []

  uploadProgress = ''
  uploadFileName = ''
  uploadFileSize = ''
  uploadTime = ''
  uploadSpeed = ''

  file: any = ''
  region = ''
  blockSize = 4096
  thread = 4

  regions: RegionModel[] = []
  blockSizes = [256, 512, 1024, 4096]
  threads = [1, 2, 4, 8, 16]

  modalRef: NgbModalRef
  @ViewChild('uploadModal', { static: true }) modalTpl: TemplateRef<any>

  constructor(
    private modalService: NgbModal,
    private regionService: RegionService,
    private apiService: APIService,
    private utilsService: UtilsService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    this.regions = this.regionService.getAllRegions()
  }

  onChangeFile($event: any) {
    this.file = $event.target.files[0] || ''
  }

  onOpen() {
    this.modalRef = this.modalService.open(this.modalTpl, {
      size: '',
      centered: true,
      backdrop: false,
      windowClass: 'modal-md'
    })
  }

  onSubmit() {
    if (!this.region || !this.file) {
      alert('no region or file')
      return
    }
    const blobName = this.utilsService.getRandomBlobName()
    const regionName = this.region
    const file = this.file

    this.apiService.getSasUrl(regionName, blobName).subscribe((res) => {
      const url = res.url || ''
      const blob = this.utilsService.parseSasUrl(url)
      const client = this.storageService.createBlobServiceClient(blob)
      const blockBlob = client.getContainerClient('upload').getBlockBlobClient(blob.blobName)
      const uploadStartTime = new Date().getTime()
      this.uploadProgress = ''
      this.uploadTime = ''
      blockBlob
        .uploadBrowserData(file, {
          blockSize: this.blockSize * 1024, // * 1024 to convert to bytes
          // TODO: use maxSingleShotSize for multi-thread block blob upload
          concurrency: this.thread,
          onProgress: ({ loadedBytes }) => {
            this.uploadProgress = `${((loadedBytes / this.file.size) * 100).toFixed(0)}%`
          }
        })
        .then(
          () => {
            const totalTime = (new Date().getTime() - uploadStartTime) / 1000
            const speed = `${this.utilsService.getSizeStr(this.file.size / totalTime)}/s`
            this.uploadFileName = this.file.name
            this.uploadFileSize = this.utilsService.getSizeStr(this.file.size)
            this.uploadTime = `${totalTime} s`
            this.uploadSpeed = speed

            const regionObj = this.regions.filter(({ regionName: id }) => id === this.region)

            const data = {
              fileName: this.file.name,
              fileSize: this.utilsService.getSizeStr(this.file.size),
              region: regionObj[0].displayName,
              thread: this.thread,
              blockSize: this.blockSize,
              uploadSpeed: speed
            }
            this.tableData.push(data)
          },
          () => {
            // TODO: handle upload error
          }
        )
    })
  }

  onUploadComplete() {}

  onCancel() {
    this.modalRef.dismiss()
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => {
      if (sub) {
        sub.unsubscribe()
      }
    })
  }
}
