import { ErrorHandler, Injectable } from "@angular/core";
import { AppInsightsService } from "./appInsights.service";
import { ErrorTelemetryService } from "./errorTelemetry.service";
import { HttpErrorResponse } from "@angular/common/http";

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  constructor(
    private appInsights: AppInsightsService,
    private errorTelemetryService: ErrorTelemetryService
  ) {
    super();
  }

  handleError(error: any) {
    let errorMessage = "";
    if (error instanceof Error) {
      errorMessage = `${error.name} - ${error.message}, stack: ${error.stack}`;
    } else if (error instanceof HttpErrorResponse) {
      errorMessage = error.message;
    } else {
      errorMessage = error.toString();
    }

    this.errorTelemetryService.ingestError(errorMessage).subscribe();
    this.appInsights.trackException(error);
  }
}
