import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import axios from 'axios'
import { Subject, timer } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { curveBasis } from 'd3-shape'
import { colorSets, DataItem, MultiSeries, LegendPosition } from '@swimlane/ngx-charts'
import { RegionService, SeoService } from '../../../services'
import { RegionModel } from '../../../models'

interface ChartRawData {
  name: string
  storageAccountName: string
  series: DataItem[]
}

interface LatencyTestResult {
  geography: string
  displayName: string
  physicalLocation: string
  storageAccountName: string
  averageLatency: number
}

@Component({
  selector: 'app-azure-latency',
  templateUrl: './latency.component.html'
})
export class LatencyComponent implements OnInit, OnDestroy {
  private static readonly MAX_PING_ATTEMPTS = 180
  private static readonly PING_INTERVAL_MS = 2000
  private static readonly CHART_X_AXIS_LENGTH = 60
  private static readonly CHART_UPDATE_INTERVAL_MS = 1000
  public tableData: LatencyTestResult[] = []
  public tableDataTop3: LatencyTestResult[] = []
  public chartDataSeries: MultiSeries = []
  public colorScheme = colorSets.find((s) => s.name === 'picnic') || colorSets[0]
  public curve = curveBasis
  public xAxisTicks: string[] = []
  public legendPosition: LegendPosition = LegendPosition.Below
  private destroy$ = new Subject<void>()
  private regions: RegionModel[] = []
  private pingAttemptCount = 0
  private pingHistory = new Map<string, number[]>()
  private latestPingTime = new Map<string, number>()
  private chartRawData: ChartRawData[] = []
  private pingTimerStarted = false

  constructor(
    private regionService: RegionService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.initializeSeoProperties()
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.subscribeToSelectedRegions()
      this.startChartTimer()
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle(
      'Azure Latency Test - Measure Latency to Azure Datacenters Worldwide'
    )
    this.seoService.setMetaDescription(
      'Test latency from your location to Azure datacenters worldwide. Measure the latency to various Azure regions and find the closest Azure datacenters.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/Latency')
  }

  private subscribeToSelectedRegions(): void {
    this.regionService.selectedRegions$
      .pipe(takeUntil(this.destroy$))
      .subscribe((regions: RegionModel[]) => {
        this.regions = regions
        this.resetPingData()
        if (!this.pingTimerStarted) {
          this.startPingTimer()
          this.pingTimerStarted = true
        }
      })
  }

  private resetPingData(): void {
    this.pingAttemptCount = 0
    this.pingHistory.clear()
    this.latestPingTime.clear()
    this.chartRawData = []
    this.tableData = []
    this.tableDataTop3 = []
    this.chartDataSeries = []
  }

  private startPingTimer(): void {
    timer(0, LatencyComponent.PING_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        if (this.pingAttemptCount < LatencyComponent.MAX_PING_ATTEMPTS) {
          await this.pingAllRegions()
          this.pingAttemptCount++
        }
      })
  }

  private async pingAllRegions(): Promise<void> {
    const concurrency = 4
    const tasks: Promise<void>[] = []
    for (const region of this.regions) {
      if (tasks.length >= concurrency) {
        await Promise.race(tasks)
      }
      const pingPromise = this.pingRegion(region).then(() => {
        tasks.splice(tasks.indexOf(pingPromise), 1)
      })
      tasks.push(pingPromise)
    }
    await Promise.all(tasks)
  }

  private async pingRegion(region: RegionModel): Promise<void> {
    const url = this.constructPingUrl(region)
    const pingStartTime = isPlatformBrowser(this.platformId) ? performance.now() : Date.now()
    try {
      await axios.head(url, {
        timeout: 2000,
        params: {
          _: Date.now() // Cache busting
        }
      })
      const pingEndTime = isPlatformBrowser(this.platformId) ? performance.now() : Date.now()
      const pingDuration = pingEndTime - pingStartTime
      if (region.storageAccountName) {
        this.processPing(region.storageAccountName, pingDuration)
      }
    } catch (error) {
      console.error(`Error pinging region: ${region.displayName}`, error)
    }
  }

  private processPing(storageAccountName: string, pingDuration: number): void {
    const pingDurationMs = Math.round(pingDuration)
    if (pingDurationMs <= 500) {
      this.latestPingTime.set(storageAccountName, pingDurationMs)
      const history = this.pingHistory.get(storageAccountName) || []
      history.push(pingDuration)

      this.pingHistory.set(storageAccountName, history)
      this.formatData()
    }
  }

  private constructPingUrl({ storageAccountName }: RegionModel): string {
    return `https://${storageAccountName}.blob.core.windows.net/public/latency-test.json`
  }

  private formatData(): void {
    this.tableData = this.regions
      .filter(
        (region: RegionModel) =>
          region.storageAccountName &&
          this.latestPingTime.get(region.storageAccountName) &&
          this.latestPingTime.get(region.storageAccountName)! > 0
      )
      .map((region: RegionModel) => {
        const pingTimes =
          (region.storageAccountName && this.pingHistory.get(region.storageAccountName)) || []

        // Exclude the highest ping time which might have extra DNS look up time
        const sortedPingTimes = [...pingTimes].sort((a, b) => a - b)
        sortedPingTimes.pop()
        const sum = sortedPingTimes.reduce((a, b) => a + Number(b), 0)
        const avg = sortedPingTimes.length > 0 ? Math.floor(sum / sortedPingTimes.length) : 0
        return {
          geography: region.geography,
          displayName: region.displayName,
          physicalLocation: region.physicalLocation,
          storageAccountName: region.storageAccountName,
          averageLatency: avg
        }
      })
      .sort((a, b) => a.averageLatency - b.averageLatency)

    this.tableDataTop3 = [...this.tableData].filter((item) => item.averageLatency > 0).slice(0, 3)
  }

  private startChartTimer(): void {
    timer(0, LatencyComponent.CHART_UPDATE_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateChart()
      })
  }

  private updateChart(): void {
    if (!isPlatformBrowser(this.platformId)) return
    const now = new Date()
    const currentSecond = now.getTime()
    const secondArr = Array.from({ length: LatencyComponent.CHART_X_AXIS_LENGTH }, (_j, i) => {
      return currentSecond - i * 1000
    }).reverse()
    this.tableData.forEach(({ storageAccountName, displayName }) => {
      if (storageAccountName) {
        let isNew = true

        this.chartRawData.forEach((item: ChartRawData) => {
          if (storageAccountName === item.storageAccountName) {
            isNew = false
          }
        })
        if (isNew) {
          this.chartDataSeries.push({
            name: displayName,
            series: secondArr.map((i) => ({
              name: this.formatXAxisTick(i),
              value: 0
            }))
          })
          this.chartRawData.push({
            storageAccountName,
            name: displayName,
            series: secondArr.map((i) => ({ name: i, value: 0 }))
          })
        }
      }
    })

    this.updateChartRawData(currentSecond)
    this.updateChartData()
    this.updateXAxisTicks()
  }

  private updateChartRawData(currentSecond: number) {
    this.chartRawData.forEach((item: ChartRawData) => {
      const { storageAccountName, series } = item
      const pingTime = this.latestPingTime.get(storageAccountName) || 0
      const isRemove = !this.tableData.some((td) => storageAccountName === td.storageAccountName)
      if (series.length > LatencyComponent.CHART_X_AXIS_LENGTH - 1) {
        series.shift()
      }

      series.push({
        name: currentSecond,
        value: isRemove ? 0 : pingTime
      })
    })
  }

  private updateChartData(): void {
    const arr = this.chartRawData.map((item: ChartRawData) => {
      return {
        name: item.name,
        series: item.series.map((seriesItem: DataItem) => ({
          name: this.formatXAxisTick(Number(seriesItem.name)),
          value: seriesItem.value
        }))
      }
    })
    this.chartDataSeries = [...arr]
  }

  private updateXAxisTicks(): void {
    this.xAxisTicks = this.chartRawData[0]
      ? this.chartRawData[0].series
          .filter((seriesItem: DataItem) => {
            const timestamp = parseInt(String(seriesItem.name), 10)
            const s = new Date(timestamp).getSeconds()
            return s % 5 === 0
          })
          .map((seriesItem: DataItem) =>
            this.formatXAxisTick(parseInt(String(seriesItem.name), 10))
          )
      : []
  }

  private formatXAxisTick(timestamp: number): string {
    const date = new Date(timestamp)
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  }
}
