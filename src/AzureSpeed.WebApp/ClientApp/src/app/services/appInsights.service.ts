import { Injectable } from "@angular/core";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class AppInsightsService {
  private appInsights = null;

  constructor() {
    const key = environment.appInsightKey;
    if (key) {
      this.appInsights = new ApplicationInsights({
        config: {
          disableAjaxTracking: true, // Do not track every ajax calls
          instrumentationKey: key,
          samplingPercentage: 30
        }
      });
      this.appInsights.loadAppInsights();
    }
  }

  trackException(error) {
    if (this.appInsights) {
      this.appInsights.trackException({ exception: error });
    }
  }
}
