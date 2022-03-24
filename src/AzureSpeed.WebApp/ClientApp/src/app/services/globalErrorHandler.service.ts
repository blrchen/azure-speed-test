import { ErrorHandler, Injectable } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { AppInsightsService } from "./appInsights.service";

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  constructor(private appInsights: AppInsightsService) {
    super();
  }

  override handleError(error: any) {
    let errorMessage: string;
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
