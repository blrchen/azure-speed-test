import { ErrorHandler, Injectable } from "@angular/core";
import { AppInsightsService } from "./appInsights.service";

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  constructor(private appInsights: AppInsightsService) {
    super();
  }

  handleError(error) {
    // do something with the exception
    alert(error);
    this.appInsights.trackException(error);
  }
}
