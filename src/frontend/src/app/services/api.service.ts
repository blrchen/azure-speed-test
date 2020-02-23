import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { RegionModel } from "../models";

@Injectable({
  providedIn: "root"
})
export class APIService {
  constructor(private httpClient: HttpClient) {}

  public ping(region: RegionModel): Observable<any> {
    const { storageAccountName, geography } = region;
    const url =
      geography === "China"
        ? `https://${storageAccountName}.blob.core.chinacloudapi.cn/public/callback.js`
        : `https://${storageAccountName}.blob.core.windows.net/public/callback.js`;
    const headers = new HttpHeaders({
      // 'Content-Type': '*/*',
      "Cache-Control": "no-cache",
      Accept: "*/*"
    });
    return this.httpClient
      .get(url, {
        headers,
        responseType: "text"
        // params: new HttpParams().append('_', String(new Date().getTime()/1000))
      })
      .pipe(catchError(this.handleError));
  }

  public getUploadUrl(
    blobName,
    locationId,
    operation = "upload"
  ): Observable<any> {
    const url = "http://api.azurespeed.com/api/sas";
    const headers = new HttpHeaders({
      // 'Content-Type': '*/*',
      "Cache-Control": "no-cache"
    });
    const params = new HttpParams({
      fromObject: {
        blobName,
        locationId,
        operation
      }
    });
    return this.httpClient
      .get(url, {
        headers,
        params
      })
      .pipe(catchError(this.handleError));
  }

  public getAzureBillingMeters(): Observable<any> {
    const url = "http://api.azurespeed.com/api/billingmeters";
    const headers = new HttpHeaders({
      // 'Content-Type': '*/*',
      "Cache-Control": "no-cache"
    });
    return this.httpClient
      .get(url, {
        headers,
        responseType: "json"
      })
      .pipe(catchError(this.handleError));
  }

  public getAzureVMSlugs(): Observable<any> {
    const url = "http://api.azurespeed.com//api/vmslugs";
    const headers = new HttpHeaders({
      // 'Content-Type': '*/*',
      "Cache-Control": "no-cache"
    });
    return this.httpClient
      .get(url, {
        headers,
        responseType: "json"
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error(error);
    // if (error.error instanceof ErrorEvent) {
    //   // A client-side or network error occurred. Handle it accordingly.
    //   console.error('An error occurred:', error.error.message);
    // } else {
    //   // The backend returned an unsuccessful response code.
    //   // The response body may contain clues as to what went wrong,
    //   console.error(
    //     `Backend returned code ${error.status}, ` +
    //     `body was: ${error.error}`);
    // }
    // return an observable with a user-facing error message
    return throwError("Something bad happened; please try again later.");
  }
}
