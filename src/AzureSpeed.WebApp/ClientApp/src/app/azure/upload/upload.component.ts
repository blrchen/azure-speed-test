import { Component, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'
import { APIService, RegionService, StorageService, UtilsService } from '../../services'
import { RegionModel } from '../../models'

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html'
})
export class UploadComponent implements OnInit, OnDestroy {
  subs: Subscription[] = []
  tableData: RegionModel[] = []
  historyData = new Map<string, any>()
  regions: RegionModel[] = []

  constructor(
    private apiService: APIService,
    private regionService: RegionService,
    private storageService: StorageService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    const sub = this.regionService.getRegions().subscribe((res) => {
      this.regions = res || []
    })
    this.subs.push(sub)
  }

  async onStartTest() {
    this.tableData = []
    // DO NOT use forEach as await not working inside forEach
    // this.regions.forEach(async (region) => {
    //   await this.uploadBlob(region);
    // });

    for (const region of this.regions) {
      await this.uploadBlob(region)
    }
  }

  async uploadBlob(region: RegionModel) {
    const { geography, displayName, physicalLocation, regionName, storageAccountName } = region
    console.log('uploadBlob starts for', regionName)
    const res = await this.apiService
      .getSasUrl(regionName, this.utilsService.getRandomBlobName())
      .toPromise()
    console.log('get sas url for ', regionName, res.url)
    const blob = this.utilsService.parseSasUrl(res.url)
    const client = this.storageService.createBlobServiceClient(blob)
    const blockId = btoa('block-00000').replace(/=/g, 'a')
    const blockBlob = client.getContainerClient('upload').getBlockBlobClient(blob.blobName)
    const sizeBytes = 100 * 1024 * 1024 // 100MB
    const uploadStartTime = new Date().getTime()
    await blockBlob.stageBlock(blockId, this.createBlob(sizeBytes), sizeBytes, {
      onProgress: ({ loadedBytes }) => {
        console.log('onProgress fired for ', regionName)
        const progress = `${((loadedBytes / sizeBytes) * 100).toFixed(0)}%`
        const totalTime = (new Date().getTime() - uploadStartTime) / 1000
        const speed = `${this.utilsService.getSizeStr(sizeBytes / totalTime)}/s`
        this.historyData.set(storageAccountName, {
          storageAccountName,
          geography,
          displayName,
          physicalLocation,
          progress,
          speed
        })

        let index = -1
        this.tableData.forEach(({ storageAccountName: account2 }, i) => {
          if (storageAccountName === account2) {
            index = i
          }
        })

        if (index > -1) {
          this.tableData.splice(index, 1, this.historyData.get(storageAccountName))
        } else {
          this.tableData.push(this.historyData.get(storageAccountName))
        }
      }
    })
    console.log('stageBlock done for ', regionName)

    await blockBlob.commitBlockList([blockId])
    console.log('commitBlockList done for ', regionName)
  }

  createBlob(size = 0): Blob {
    const arr = new Uint8Array(size)
    return new Blob([arr], { type: 'application/octet-stream' })
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => {
      if (sub) {
        sub.unsubscribe()
      }
    })
  }
}
