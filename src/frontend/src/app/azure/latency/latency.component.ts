import { Component, OnInit, OnDestroy } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Subscription, timer } from "rxjs";
import * as shape from "d3-shape";
import {
  SingleSeries,
  MultiSeries,
  BubbleChartMultiSeries,
  Series,
  TreeMapData,
  colorSets
} from "@swimlane/ngx-charts";

import { APIService, RegionService } from "../../services";
import { RegionModel, DefaultRegionsKey } from "../../models";

import { LatencyTableModel, HistoryModel } from "./utils";

@Component({
  selector: "app-azure-latency",
  templateUrl: "./latency.component.html",
  styleUrls: ["./latency.component.scss"]
})
export class LatencyComponent implements OnInit, OnDestroy {
  regions: RegionModel[] = [];

  pingCount = 0;
  maxPingCount = 180; // 180;
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
      if (this.pingCount < this.maxPingCount) {
        this.pingFun();
        this.pingCount++;
      } else {
        if (this.timer$) {
          this.timer$.unsubscribe();
        }

        this.timer$ = null;
      }
      // console.log(this.pingCount, this.maxPingCount)
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
      const formatTime = (ts: number) => {
        // return timeStamp
        const dateCopy = new Date(ts);
        return dateCopy.getSeconds() === 0
          ? dateCopy.toLocaleTimeString("it-IT").slice(0, 5)
          : `:${dateCopy.getSeconds()}`;
      };
      const date = new Date();
      const timeStamp = date.getTime() / 1000;
      const second = timeStamp * 1000;
      const secondArr = Array.from({ length: xLength }, (j, i) => {
        const t = timeStamp - i;
        return t * 1000;
      }).reverse();
      // console.log(second)
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
            series: secondArr.map(i => ({ name: formatTime(i), value: 0 }))
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
            name: formatTime(name2),
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
            .map(({ name }) => formatTime(parseInt(String(name), 10)))
        : [];

      // console.log(this.xAxisTicks)
      // console.log(this.lineChartData[0] ? this.lineChartData[0].series : [])
      // console.log(JSON.stringify(this.lineChartData))
    });

    this.subs.push(timer$);
  }

  pingFun() {
    // this.tableData = [];
    // console.log(this.regions)

    this.regions.forEach((element, index) => {
      const { storageAccountName, geography, location, name } = element;
      const t1 = new Date().getTime();
      this.startTime[storageAccountName] = t1;
      const sub = this.apiService.ping(element).subscribe(res => {
        // console.log(11111111111111111)
        const t = (
          new Date().getTime() - this.startTime[storageAccountName]
        ).toFixed(0);

        if (!this.history[storageAccountName]) {
          this.history[storageAccountName] = [];
        }

        this.history[storageAccountName].push(t);
        this.latest[storageAccountName] = t;

        this.formatData();
      });

      // this.subs.push(sub);
    });
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
