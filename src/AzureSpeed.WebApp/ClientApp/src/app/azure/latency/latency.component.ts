import { Component, OnDestroy, OnInit } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { curveBasis } from 'd3-shape'
import { colorSets, DataItem, MultiSeries } from '@swimlane/ngx-charts'
import { of, Subject, timer } from 'rxjs'
import { catchError, takeUntil } from 'rxjs/operators'
import { RegionService } from '../../services'
import { RegionModel } from '../../models'

interface ChartRawData {
  name: string
  storageAccountName: string
  series: DataItem[]
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

  private destroy$ = new Subject<void>()
  private regions: RegionModel[] = []
  private pingAttemptCount = 0
  private pingHistory: Map<string, number[]> = new Map()
  private latestPingTime = new Map<string, number>()
  private chartRawData: ChartRawData[] = []

  public tableData: RegionModel[] = []
  public tableDataTop3: RegionModel[] = []
  public chartDataSeries: MultiSeries = []
  public colorScheme = colorSets.find((s) => s.name === 'picnic')
  public curve = curveBasis
  public xAxisTicks: string[] = []

  constructor(
    private httpClient: HttpClient,
    private regionService: RegionService
  ) {}

  ngOnInit(): void {
    this.fetchRegionData()
    this.startChartTimer()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private fetchRegionData(): void {
    this.regionService
      .getRegions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: RegionModel[]) => {
        this.regions = res
        this.startPingTimer()
      })
  }

  private startPingTimer(): void {
    timer(0, LatencyComponent.PING_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.pingAttemptCount < LatencyComponent.MAX_PING_ATTEMPTS) {
          this.pingAllRegions()
          this.pingAttemptCount++
        }
      })
  }

  private pingAllRegions(): void {
    this.regions.forEach((region) => {
      this.pingRegion(region)
    })
  }

  private pingRegion(region: RegionModel): void {
    const url = this.constructPingUrl(region)
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache',
      Accept: '*/*'
    })
    const pingStartTime = performance.now()
    this.httpClient
      .get(url, { headers, responseType: 'text' })
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error(`Error pinging region: ${region.displayName}`, error)
          return of(null)
        })
      )
      .subscribe(() => {
        const pingEndTime = performance.now()
        const pingDuration = pingEndTime - pingStartTime
        this.processPing(region.storageAccountName, pingDuration)
      })
  }

  private processPing(storageAccountName: string, pingDuration: number): void {
    const pingDurationMs = Math.round(pingDuration)
    if (pingDurationMs <= 500) {
      this.latestPingTime.set(storageAccountName, pingDurationMs)
      let history = this.pingHistory.get(storageAccountName) || []
      history.push(pingDuration)

      this.pingHistory.set(storageAccountName, history)
      this.formatData()
    }
  }

  private constructPingUrl({ geography, storageAccountName }: RegionModel): string {
    const endpoint = geography === 'China' ? 'chinacloudapi.cn' : 'windows.net'
    return `https://${storageAccountName}.blob.core.${endpoint}/public/latency-test.json`
  }

  private formatData(): void {
    this.tableData = this.regions
      .filter(({ storageAccountName }) => this.latestPingTime.get(storageAccountName) > 0)
      .map((region) => {
        const pingTimes = this.pingHistory.get(region.storageAccountName) || []

        // Exclude the highest ping time which might have extra DNS look up time
        const sortedPingTimes = [...pingTimes].sort((a, b) => a - b)
        sortedPingTimes.pop()
        const sum = sortedPingTimes.reduce((a, b) => a + Number(b), 0)
        const avg = sortedPingTimes.length > 0 ? Math.floor(sum / sortedPingTimes.length) : 0
        return { ...region, averageLatency: avg }
      })

    this.tableDataTop3 = [...this.tableData]
      .sort((a, b) => (a.averageLatency || 0) - (b.averageLatency || 0))
      .slice(0, 3)
  }

  private startChartTimer(): void {
    timer(0, LatencyComponent.CHART_UPDATE_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateChart()
      })
  }

  private updateChart(): void {
    const now = new Date()
    const currentSecond = now.getTime()
    const secondArr = Array.from({ length: LatencyComponent.CHART_X_AXIS_LENGTH }, (_j, i) => {
      return currentSecond - i * 1000
    }).reverse()
    this.tableData.forEach(({ storageAccountName, displayName }) => {
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
    })

    this.updateChartRawData(currentSecond)
    this.updateChartData()
    this.updateXAxisTicks()
  }

  private updateChartRawData(currentSecond: number) {
    this.chartRawData.forEach((item: ChartRawData) => {
      const { storageAccountName, series } = item
      const pingTime = this.latestPingTime.get(storageAccountName) || 0
      let isRemove = !this.tableData.some((td) => storageAccountName === td.storageAccountName)
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
