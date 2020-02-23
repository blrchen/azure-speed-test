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
          instrumentationKey: key,
          disableAjaxTracking: true,
          enableAutoRouteTracking: true
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
