import { Component, OnInit, OnDestroy } from '@angular/core';
import { timer, Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { curveBasis } from 'd3-shape';
import { colorSets, DataItem, MultiSeries } from '@swimlane/ngx-charts';
import { RegionService } from '../../services';
import { HistoryModel, RegionModel } from '../../models';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface LineChartRawData {
  storageAccountName: string;
  name: string;
  series: DataItem[];
}

@Component({
  selector: 'app-azure-latency',
  templateUrl: './latency.component.html',
})
export class LatencyComponent implements OnInit, OnDestroy {
  private static readonly MAX_PING_COUNT = 180;
  private static readonly PING_INTERVAL = 2000;
  private static readonly CHART_X_LENGTH = 60;
  private static readonly CHART_UPDATE_INTERVAL = 1000;

  private destroy$ = new Subject<void>();
  private firstPingMap = new Map<string, boolean>();
  private pingCount = 0;
  private regions: RegionModel[] = [];
  private history: HistoryModel = {};
  private latestPingTime = new Map<string, number>();
  private lineChartRawData: LineChartRawData[] = [];

  public tableData: RegionModel[] = [];
  public tableDataTop3: RegionModel[] = [];
  public lineChartData: MultiSeries = [];
  public colorScheme = colorSets.find((s) => s.name === 'picnic');
  public curve = curveBasis;
  public xAxisTicks: any[] = [];

  constructor(
    private httpClient: HttpClient,
    private regionService: RegionService,
  ) {}

  ngOnInit() {
    this.fetchRegionData();
    this.startChartTimer();
  }

  fetchRegionData() {
    this.regionService
      .getRegions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.regions = res;
        this.formatData();
        this.startPingTimer();
      });
  }

  startPingTimer() {
    timer(0, LatencyComponent.PING_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.pingCount < LatencyComponent.MAX_PING_COUNT) {
          this.sendHttpPing();
          this.pingCount++;
        }
      });
  }

  formatData() {
    this.tableData = this.regions
      .filter(({ storageAccountName }) => this.latestPingTime.get(storageAccountName) > 0)
      .map((item) => ({ ...item, averageLatency: this.latestPingTime.get(item.storageAccountName) }));

    this.tableDataTop3 = [...this.tableData]
      .sort((a, b) => a.averageLatency - b.averageLatency)
      .slice(0, 3);
  }

  startChartTimer() {
    timer(0, LatencyComponent.CHART_UPDATE_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateLineChart();
      });
  }

  updateLineChart() {
    const date = new Date();
    const timeStamp = date.getTime() / 1000;
    const second = timeStamp * 1000;
    const secondArr = Array.from({ length: LatencyComponent.CHART_X_LENGTH }, (_j, i) => {
      const t = timeStamp - i;
      return t * 1000;
    }).reverse();
    this.tableData.forEach(({ storageAccountName, displayName }) => {
      let isNew = true;

      this.lineChartRawData.forEach((item: LineChartRawData) => {
        if (storageAccountName === item.storageAccountName) {
          isNew = false;
        }
      });
      if (isNew) {
        this.lineChartData.push({
          name: displayName,
          series: secondArr.map((i) => ({
            name: this.formatXAxisTick(i),
            value: 0,
          })),
        });
        this.lineChartRawData.push({
          storageAccountName,
          name: displayName,
          series: secondArr.map((i) => ({ name: i, value: 0 })),
        });
      }
    });

    this.lineChartRawData.forEach((item: LineChartRawData) => {
      const { storageAccountName, series } = item;
      const t = this.latestPingTime.get(storageAccountName) || 0;
      let isRemove = true;
      this.tableData.forEach((td) => {
        if (storageAccountName === td.storageAccountName) {
          isRemove = false;
        }
      });
      if (series.length > LatencyComponent.CHART_X_LENGTH - 1) {
        series.shift();
      }

      series.push({
        name: second,
        value: isRemove ? 0 : t,
      });
    });

    const arr = this.lineChartRawData.map((item: LineChartRawData) => {
      return {
        name: item.name,
        series: item.series.map((seriesItem: DataItem) => ({
          name: this.formatXAxisTick(Number(seriesItem.name)),
          value: seriesItem.value,
        })),
      };
    });
    this.lineChartData = [...arr];

    this.xAxisTicks = this.lineChartRawData[0]
      ? this.lineChartRawData[0].series
          .filter((seriesItem: DataItem) => {
            const timestamp = parseInt(String(seriesItem.name), 10);
            const s = new Date(timestamp).getSeconds();
            return s % 5 === 0;
          })
          .map((seriesItem: DataItem) => this.formatXAxisTick(parseInt(String(seriesItem.name), 10)))
      : [];
  }

  sendHttpPing() {
    this.regions.forEach((region) => {
      const { storageAccountName, geography } = region;
      const url =
        geography === 'China'
          ? `https://${storageAccountName}.blob.core.chinacloudapi.cn/public/latency-test.json`
          : `https://${storageAccountName}.blob.core.windows.net/public/latency-test.json`;
      const headers = new HttpHeaders({
        'Cache-Control': 'no-cache',
        Accept: '*/*',
      });
      const startPingTime = performance.now();
      this.httpClient.get(url, { headers, responseType: 'text' })
        .pipe(
          takeUntil(this.destroy$),
          catchError((err) => {
            console.error(`Error pinging region: ${region.displayName}`, err);
            return of(null);
          }),
        )
        .subscribe(() => {
          const endPingTime = performance.now();
          const pingTime = (endPingTime - startPingTime).toFixed(0);

          if (!this.history[storageAccountName]) {
            this.history[storageAccountName] = [];
          }

          // Check if it's the first ping for this region
          if (!this.firstPingMap.get(storageAccountName)) {
            // If it's the first ping, mark it as done and skip this ping
            this.firstPingMap.set(storageAccountName, true);
          } else {
            // If it's not the first ping, process it normally
            this.latestPingTime.set(storageAccountName, Number(pingTime));
            this.history[storageAccountName].push(pingTime);
          }

          this.formatData();
        });
    });
  }

  formatXAxisTick(timeStamp: number): string {
    const date = new Date(timeStamp);
    const second = date.getSeconds();
    const h = date.getHours();
    const m = date.getMinutes();
    const hStr = h > 9 ? h : `0${h}`;
    const mStr = m > 9 ? m : `0${m}`;
    return second === 0 ? `${hStr}:${mStr}` : `:${second}`;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
