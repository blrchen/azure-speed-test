import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription, timer } from "rxjs";
import * as shape from "d3-shape";
import { MultiSeries, colorSets } from "@swimlane/ngx-charts";
import { APIService, RegionService } from "../../services";
import { RegionModel } from "../../models";
import { HistoryModel } from "./utils";

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

  lineChartData: MultiSeries = [];
  lineChartRawData: any = [];

  pingTimer$: Subscription = null;
  chartTimer$: Subscription = null;

  // chart params
  colorScheme = colorSets.find((s) => s.name === "picnic");
  view = undefined;
  curve = shape.curveBasis;

  xAxisTicks: any[] = [];

  constructor(private apiService: APIService, private regionService: RegionService) {}

  ngOnInit() {
    const sub = this.regionService.getRegions().subscribe((res) => {
      if (res.length > this.regions.length && !this.pingTimer$) {
        console.log("will set pingcount to 0");
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
      // From: https://www.dotcom-tools.com/website-speed-test.aspx
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
      const { regionName, displayName, storageAccountName, physicalLocation, geography } = item;
      const t = this.latestPingTime.get(storageAccountName);
      if (t > 0) {
        tableDataCache.push({
          regionName,
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

        this.lineChartRawData.forEach(({ storageAccountName: storageAccountName2 }) => {
          if (storageAccountName === storageAccountName2) {
            isNew = false;
          }
        });
        if (isNew) {
          this.lineChartData.push({
            name: displayName,
            series: secondArr.map((i) => ({
              name: this.formatxAxisTick(i),
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

      this.lineChartRawData.forEach((item) => {
        const { storageAccountName, series } = item;
        const t = this.latestPingTime.get(storageAccountName) || 0;
        let isRemove = true;
        this.tableData.forEach(({ storageAccountName: storageAccountName2 }) => {
          if (storageAccountName === storageAccountName2) {
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

      const arr = this.lineChartRawData.map(({ name, series }) => {
        return {
          name,
          series: series.map(({ name: name2, value }) => ({
            name: this.formatxAxisTick(name2),
            value,
          })),
        };
      });
      this.lineChartData = [...arr];

      this.xAxisTicks = this.lineChartRawData[0]
        ? this.lineChartRawData[0].series
            .filter(({ name }) => {
              const timeStamp2 = parseInt(String(name), 10);
              const s = new Date(timeStamp2).getSeconds();
              return s % 5 === 0;
            })
            .map(({ name }) => this.formatxAxisTick(parseInt(String(name), 10)))
        : [];
    });
  }

  sendHttpPing() {
    this.regions.forEach((region) => {
      const { storageAccountName } = region;
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

  formatxAxisTick(timeStamp: number): string {
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
