import { ErrorHandler, Injectable } from "@angular/core";
import { AppInsightsService } from "./appInsights.service";
import { HttpErrorResponse } from "@angular/common/http";

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  constructor(private appInsights: AppInsightsService) {
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

    // Skip error with message: AJAX request was cancelled
    if (errorMessage === "AJAX request was cancelled. ") {
      return;
    }

    console.error(errorMessage);
    this.appInsights.trackException(error);
  }
}
