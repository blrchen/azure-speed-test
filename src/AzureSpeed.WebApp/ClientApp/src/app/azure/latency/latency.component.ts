import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription, timer } from "rxjs";
import { curveBasis } from "d3-shape";
import { colorSets, DataItem, MultiSeries } from "@swimlane/ngx-charts";
import { APIService, RegionService } from "../../services";
import { HistoryModel, RegionModel } from "../../models";

@Component({
  selector: "app-azure-latency",
  templateUrl: "./latency.component.html",
  styleUrls: ["./latency.component.scss"],
})
export class LatencyComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];
  regions: RegionModel[] = [];

  pingCount = 0;
  maxPingCount = 180;
  updateInterval = 2000;

  history: HistoryModel = {};
  startTime = new Map<string, number>();
  latestPingTime = new Map<string, number>();

  tableData: RegionModel[] = [];
  tableDataTop3: RegionModel[] = [];

  lineChartRawData: any = [];

  pingTimer$: Subscription = null;
  chartTimer$: Subscription = null;

  // Line Chart settings
  view: number[] = undefined; // Chart will fit to the parent container size
  lineChartData: MultiSeries = [];
  colorScheme = colorSets.find((s) => s.name === "picnic");
  curve = curveBasis;
  xAxisTicks: any[] = [];

  constructor(private apiService: APIService, private regionService: RegionService) {}

  ngOnInit() {
    const sub = this.regionService.getRegions().subscribe((res) => {
      if (res.length > this.regions.length && !this.pingTimer$) {
        this.pingCount = 0;
        this.regions = res;
      } else {
        this.regions = res;
        this.formatData();
      }
      if (!this.pingTimer$) {
        this.pingTimer();
      }
    });
    this.chartTimer();
    this.subs.push(sub);
  }

  pingTimer() {
    this.pingTimer$ = timer(0, this.updateInterval).subscribe(() => {
      // This ping result is calculated by sending a https request a file hosted in Azure storage
      // Resource: https://www.dotcom-tools.com/website-speed-test.aspx
      // First ping: DNS + Connection + SSL + Request + First Package + Download
      // Repeat ping: DOM time only
      // TODO: Consider to switch to http ping to exclude SSL time
      if (this.pingCount < this.maxPingCount) {
        this.sendHttpPing();
        this.pingCount++;
      } else {
        if (this.pingTimer$) {
          this.pingTimer$.unsubscribe();
          console.log("pingTimer$ unsubscribed");
        }
      }
    });
  }

  formatData() {
    const tableDataCache: RegionModel[] = [];
    this.regions.forEach((item, index) => {
      const { regionName, regionAccess, displayName, storageAccountName, physicalLocation, geography } = item;
      const t = this.latestPingTime.get(storageAccountName);
      if (t > 0) {
        tableDataCache.push({
          regionName,
          regionAccess,
          displayName,
          storageAccountName,
          physicalLocation,
          geography,
          averageLatency: t,
        });
      }

      if (index === this.regions.length - 1 || !this.tableData.length) {
        this.tableData = tableDataCache;
      }
    });

    this.tableDataTop3 = this.tableData
      .slice(0, this.tableData.length)
      .sort((a, b) => a.averageLatency - b.averageLatency)
      .slice(0, 3);
  }

  chartTimer() {
    const xLength = 60;
    this.chartTimer$ = timer(0, 1000).subscribe(() => {
      const date = new Date();
      const timeStamp = date.getTime() / 1000;
      const second = timeStamp * 1000;
      const secondArr = Array.from({ length: xLength }, (_j, i) => {
        const t = timeStamp - i;
        return t * 1000;
      }).reverse();
      this.tableData.forEach(({ storageAccountName, displayName }) => {
        let isNew = true;

        this.lineChartRawData.forEach((item: any) => {
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

      this.lineChartRawData.forEach((item: any) => {
        const { storageAccountName, series } = item;
        const t = this.latestPingTime.get(storageAccountName) || 0;
        let isRemove = true;
        this.tableData.forEach((td) => {
          if (storageAccountName === td.storageAccountName) {
            isRemove = false;
          }
        });
        if (series.length > xLength - 1) {
          series.shift();
        }

        series.push({
          name: second,
          value: isRemove ? 0 : t,
        });
      });

      const arr = this.lineChartRawData.map((item: any) => {
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
    });
  }

  sendHttpPing() {
    this.regions.forEach((region) => {
      const { regionAccess, storageAccountName } = region;
      if (!regionAccess) {
        return;
      }
      this.startTime.set(storageAccountName, new Date().getTime());
      // TODO(blair): review all sub pattern to ensure disposal logic
      const sub = this.apiService.ping(region).subscribe(() => {
        const pingTime = (new Date().getTime() - this.startTime.get(storageAccountName)).toFixed(0);

        if (!this.history[storageAccountName]) {
          this.history[storageAccountName] = [];
        }

        // Drop first ping result as it includes extra DNS time
        if (this.pingCount >= 2) {
          console.log(`region = ${region.displayName}, ping count = ${this.pingCount}, ping time = ${pingTime}`);
          this.latestPingTime.set(storageAccountName, Number(pingTime));
          this.history[storageAccountName].push(pingTime);
        }

        this.formatData();
      });
      this.subs.push(sub);
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
    this.subs.forEach((sub) => {
      if (sub) {
        sub.unsubscribe();
      }
    });
    if (this.pingTimer$) {
      this.pingTimer$.unsubscribe();
    }
    if (this.chartTimer$) {
      this.chartTimer$.unsubscribe();
    }
  }
}
