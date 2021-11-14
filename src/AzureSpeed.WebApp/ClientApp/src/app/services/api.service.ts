import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { RegionModel, IpInfo, SasUrlInfo } from "../models";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class APIService {
  private apiEndpoint = "";

  constructor(private httpClient: HttpClient) {
    this.apiEndpoint = environment.apiEndpoint;
  }

  public ping(region: RegionModel): Observable<any> {
    const { storageAccountName, geography } = region;
    const url =
      geography === "China"
        ? `https://${storageAccountName}.blob.core.chinacloudapi.cn/public/latency-test.json`
        : `https://${storageAccountName}.blob.core.windows.net/public/latency-test.json`;
    const headers = new HttpHeaders({
      "Cache-Control": "no-cache",
      Accept: "*/*",
    });
    return this.httpClient.get(url, { headers, responseType: "text" }).pipe(catchError(this.handleError));
  }

  public getSasUrl(regionName: string, blobName: string, operation = "upload"): Observable<SasUrlInfo> {
    const url = this.apiEndpoint + "/api/sas";
    const params = new HttpParams({
      fromObject: {
        regionName,
        blobName,
        operation,
      },
    });
    return this.httpClient.get<SasUrlInfo>(url, { params }).pipe(catchError(this.handleError));
  }

  public getIpInfo(ipAddressOrUrl: string): Observable<IpInfo[]> {
    const url = this.apiEndpoint + "/api/ipinfo?ipAddressOrUrl=" + ipAddressOrUrl;
    return this.httpClient.get<IpInfo[]>(url).pipe(catchError(this.handleError));
  }

  // Use arrow function so this context is not lost
  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = "";
    if (error.error instanceof ErrorEvent) {
      errorMessage = `A client-side or network error occurred: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = "AJAX request was cancelled. ";
      }
      // The backend returned an unsuccessful response code.
      else if (error.status === 404) {
        console.error("Resource not found.");
      }

      // The response body may contain clues as to what went wrong.
      if (error.error && error.error.message) {
        errorMessage += `Server response: ${error.error.message}`;
      }
    }

    // Return an observable with a user-facing error message.
    console.error(errorMessage);
    return throwError(errorMessage);
  };
}
