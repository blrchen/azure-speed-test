import { BehaviorSubject, Observable } from "rxjs";
import { Injectable } from "@angular/core";

import { DefaultRegionsKey, RegionModel } from "../models";

@Injectable({
  providedIn: "root"
})
export class UtilsService {
  private regionSubject = new BehaviorSubject<RegionModel[]>([]);

  constructor() {}

  splitUrl(url) {
    const regex = new RegExp(
      "(http[s]?://([^.]+).[^/]*)/([^?/]*)/?([^?]*)(.*)",
      "g"
    );
    const match = regex.exec(url);
    if (!match) {
      throw "invalid blob url.";
    }
    return {
      endpoint: match[1],
      accountName: match[2],
      containerName: match[3],
      blobName: match[4],
      sas: match[5]
    };
  }

  getRandomBlobName() {
    const time = new Date(Date.now());
    const timestring = `${time.getFullYear()}${time.getMonth()}${time.getDate()}${time.getHours()}${time.getMinutes()}${time.getSeconds()}${time.getMilliseconds()}`;

    return timestring;
  }

  getSize(size = 0, orgUnit = "B", targetUnit = "Auto", dif = 0) {
    if (!orgUnit) {
      orgUnit = "B";
    }
    if (!targetUnit) {
      targetUnit = "Auto";
    }
    if (dif) {
      size += dif;
    }
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let idx = -1;
    for (idx = 0; idx < units.length; idx++) {
      if (units[idx].toLowerCase() === orgUnit.toLowerCase()) {
        break;
      }
    }
    let dsize = size;
    targetUnit = targetUnit.toLowerCase();
    let unit;
    while (idx < units.length) {
      unit = units[idx];
      idx++;
      if (targetUnit !== "auto" && unit.toLowerCase() === targetUnit) {
        break;
      }
      if (targetUnit === "auto" && dsize < 1024) {
        break;
      }
      dsize = dsize / 1024;
    }
    unit = units[idx - 1];
    return { value: Math.round(dsize * 100) / 100 + " ", unit: unit };
  }

  getSizeStr(size = 0, orgUnit = "B", targetUnit = "Auto", dif = 0) {
    const v = this.getSize(size, orgUnit, targetUnit, dif);
    if (v) {
      return v.value + v.unit;
    }
    return null;
  }

  convertSizeStrToFloat(v) {
    const units = ["KB", "MB", "GB", "TB", "PB", "B"];
    let idx = -1;
    let num = 0;
    for (idx = 0; idx < units.length; idx++) {
      if (v.toLowerCase().contains(units[idx].toLowerCase())) {
        num = v.toLowerCase().replace(units[idx].toLowerCase(), "");
        break;
      }
    }
    switch (units[idx].toLowerCase()) {
      case "b":
        num = parseFloat(String(num));
        break;
      case "kb":
        num = parseFloat(String(num)) * 1024;
        break;
      case "mb":
        num = parseFloat(String(num)) * 1024 * 1024;
        break;
      case "gb":
        num = parseFloat(String(num)) * 1024 * 1024 * 1024;
        break;
      case "tb":
        num = parseFloat(String(num)) * 1024 * 1024 * 1024 * 1024;
        break;
      case "pb":
        num = parseFloat(String(num)) * 1024 * 1024 * 1024 * 1024 * 1024;
        break;
      default:
        break;
    }
    return num;
  }
}
