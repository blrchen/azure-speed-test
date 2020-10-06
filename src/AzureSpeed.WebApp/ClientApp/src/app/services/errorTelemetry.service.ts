import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable()
export class ErrorTelemetryService {
  browserName = "";
  constructor(private httpClient: HttpClient) {
    this.browserName = this.getBrowserName();
    console.log(`browserName = ${this.browserName}`);
  }

  public ingestError(message: string): Observable<void> {
    const change = Math.random() * 100;
    if (change < 2) {
      // 1
      console.log("ingest error message = ", message);
      const url = `${environment.apiEndpoint}/api/error`;
      return this.httpClient.post<void>(url, {
        message: `${this.browserName}: ${message}`,
      });
    } else {
      // 2-99
      return of();
    }
  }

  public getBrowserName(): string {
    const agent = window.navigator.userAgent.toLowerCase();
    switch (true) {
      case agent.indexOf("edge") > -1:
        return "edge";
      case agent.indexOf("opr") > -1 && !!(window as any).opr:
        return "opera";
      case agent.indexOf("chrome") > -1 && !!(window as any).chrome:
        return "chrome";
      case agent.indexOf("trident") > -1:
        return "ie";
      case agent.indexOf("firefox") > -1:
        return "firefox";
      case agent.indexOf("safari") > -1:
        return "safari";
      default:
        return "other";
    }
  }
}
