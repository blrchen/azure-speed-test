import { Injectable } from "@angular/core";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AppInsightsService {
  private appInsights: ApplicationInsights;

  constructor() {
    const key = environment.appInsightKey;
    const isIEOrLegacyEdge = /msie\s|trident\/|edge\//i.test(
      window.navigator.userAgent
    );
    console.log("isIEOrLegacyEdge = ", isIEOrLegacyEdge);
    if (key && !isIEOrLegacyEdge) {
      this.appInsights = new ApplicationInsights({
        config: {
          disableAjaxTracking: true, // Do not track every ajax calls
          instrumentationKey: key,
        },
      });
      this.appInsights.loadAppInsights();
    }
  }

  trackException(error: any) {
    if (this.appInsights) {
      this.appInsights.trackException({ exception: error });
    }
  }
}
