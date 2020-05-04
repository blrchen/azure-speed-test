import { Component, OnInit, OnDestroy } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Subscription, timer } from "rxjs";
import * as shape from "d3-shape";
import { MultiSeries, colorSets } from "@swimlane/ngx-charts";

import { APIService, RegionService } from "../../services";
import { RegionModel } from "../../models";
import { LatencyTableModel, HistoryModel } from "./utils";

@Component({
  selector: "app-azure-latency",
  templateUrl: "./latency.component.html",
  styleUrls: ["./latency.component.scss"]
})
export class LatencyComponent implements OnInit, OnDestroy {
  regions: RegionModel[] = [];

  pingCount = 0;
  maxPingCount = 180;
  updateInterval = 2000;

  history: HistoryModel = {};
  startTime = {};
  latest = {};
  average = {};

  subs: Subscription[] = [];

  tableData: LatencyTableModel[] = [];
  tableDataTop3: LatencyTableModel[] = [];

  lineChartData: MultiSeries = [];
  lineChartDataCopy = [];

  timer$: Subscription = null;

  // chart params
  colorScheme = colorSets.find(s => s.name === "picnic");
  view = undefined;
  curve = shape.curveBasis;

  yAxisTicks = [0, 100, 200, 300, 400, 500];
  xAxisTicks: any[] = [];

  constructor(
    private apiService: APIService,
    private regionService: RegionService,
    private titleService: Title
  ) {}

  ngOnInit() {
    const sub = this.regionService.getRegions().subscribe(res => {
      this.titleService.setTitle("Azure Latency Test - Azure Speed Test");
      if (res.length > this.regions.length && !this.timer$) {
        this.pingCount = 0;
        this.regions = res;
      } else {
        this.regions = res;
        this.formatData();
      }

      if (!this.timer$) {
        this.pingInterval();
      }
    });

    this.subs.push(sub);

    this.chartTimer();
  }

  pingInterval() {
    this.timer$ = timer(0, this.updateInterval).subscribe(res => {
      // This ping result is calculated by sending a https request a file hosted in Azure storage
      // From: https://www.dotcom-tools.com/website-speed-test.aspx
      // First ping: DNS + Connection + SSL + Request + First Package + Download
      // Repeat ping: DOM time only
      // TODO: Consider to switch to http ping to exclude SSL time
      if (this.pingCount < this.maxPingCount) {
        this.sendHttpPing();
        this.pingCount++;
      } else {
        if (this.timer$) {
          this.timer$.unsubscribe();
        }

        this.timer$ = null;
      }
    });
  }

  formatData() {
    const tableDataCache = [];
    this.regions.forEach((item, index) => {
      const { storageAccountName, geography, location, name } = item;
      const t = this.latest[storageAccountName];
      if (t > 0) {
        tableDataCache.push({
          storageAccountName,
          geography,
          location,
          region: name,
          averageLatency: t
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
    const timer$ = timer(0, 1000).subscribe(res => {
      const date = new Date();
      const timeStamp = date.getTime() / 1000;
      const second = timeStamp * 1000;
      const secondArr = Array.from({ length: xLength }, (j, i) => {
        const t = timeStamp - i;
        return t * 1000;
      }).reverse();
      this.tableData.forEach(({ storageAccountName, region }) => {
        let isNew = true;

        this.lineChartDataCopy.forEach(
          ({ storageAccountName: storageAccountName2 }) => {
            if (storageAccountName === storageAccountName2) {
              isNew = false;
            }
          }
        );
        if (isNew) {
          this.lineChartData.push({
            name: region,
            series: secondArr.map(i => ({
              name: this.formatxAxisTick(i),
              value: 0
            }))
          });
          this.lineChartDataCopy.push({
            storageAccountName,
            name: region,
            series: secondArr.map(i => ({ name: i, value: 0 }))
          });
        }
      });

      this.lineChartDataCopy.forEach((i, index) => {
        const { storageAccountName, name, series } = i;
        const t = this.latest[storageAccountName] || 0;
        let isRemove = true;
        this.tableData.forEach(
          ({ storageAccountName: storageAccountName2 }) => {
            if (storageAccountName === storageAccountName2) {
              isRemove = false;
            }
          }
        );
        if (series.length > xLength - 1) {
          series.shift();
        }

        series.push({
          name: second,
          value: isRemove ? 0 : parseInt(t, 10)
        });
      });

      const arr = this.lineChartDataCopy.map(({ name, series }) => {
        return {
          name,
          series: series.map(({ name: name2, value }) => ({
            name: this.formatxAxisTick(name2),
            value
          }))
        };
      });
      this.lineChartData = [...arr];

      this.xAxisTicks = this.lineChartDataCopy[0]
        ? this.lineChartDataCopy[0].series
            .filter(({ name }) => {
              const timeStamp2 = parseInt(String(name), 10);
              const s = new Date(timeStamp2).getSeconds();
              return s % 5 === 0;
            })
            .map(({ name }) => this.formatxAxisTick(parseInt(String(name), 10)))
        : [];

      // console.log(this.xAxisTicks)
      // console.log(this.lineChartData[0] ? this.lineChartData[0].series : [])
      // console.log(JSON.stringify(this.lineChartData))
    });

    this.subs.push(timer$);
  }

  sendHttpPing() {
    this.regions.forEach((element, index) => {
      const { storageAccountName, geography, location, name } = element;
      const t1 = new Date().getTime();
      this.startTime[storageAccountName] = t1;
      const sub = this.apiService.ping(element).subscribe(res => {
        const t = (
          new Date().getTime() - this.startTime[storageAccountName]
        ).toFixed(0);
        // console.log("Ping result: ", t, this.pingCount);
        if (!this.history[storageAccountName]) {
          this.history[storageAccountName] = [];
        }

        // Drop first ping result as it includes extra DNS time
        if (this.pingCount >= 2) {
          // console.log("Adding to history table", t, this.pingCount);
          this.history[storageAccountName].push(t);
          this.latest[storageAccountName] = t;
        }

        this.formatData();
      });
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
    this.subs.forEach(sub => {
      if (sub) {
        sub.unsubscribe();
      }
    });
    if (this.timer$) {
      this.timer$.unsubscribe();
    }
  }
}
