import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import axios from 'axios'
import { environment } from '../../environments/environment'

interface SasUrlInfo {
  url: string
}

interface TextCompletionRequest {
  systemPromptId?: string
  userContent?: string
  responseLanguage?: string
  programLanguage?: string
}

@Injectable({
  providedIn: 'root'
})
export class APIService {
  private apiEndpoint = environment.apiEndpoint

  constructor(private httpClient: HttpClient) {}

  async getTextCompletion(payload: TextCompletionRequest): Promise<any> {
    try {
      const response = await axios.post(
        `${environment.apiEndpoint}/api/free-for-10-calls-per-ip-each-day`,
        payload
      )
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  public getSasUrl(
    regionName: string,
    blobName: string,
    operation = 'upload'
  ): Observable<SasUrlInfo> {
    const url = `${this.apiEndpoint}/api/sas`
    const params = new HttpParams()
      .set('regionName', regionName)
      .set('blobName', blobName)
      .set('operation', operation)
    return this.httpClient.get<SasUrlInfo>(url, { params }).pipe(catchError(this.handleError))
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = ''
    if (error.error instanceof ErrorEvent) {
      errorMessage = `A client-side or network error occurred: ${error.error.message}`
    } else {
      if (error.status === 0) {
        errorMessage = 'AJAX request was cancelled. '
      } else if (error.status === 404) {
        errorMessage = 'Resource not found.'
      }

      if (error.error && error.error.message) {
        errorMessage += error.error.message
      }
    }

    console.error(errorMessage)
    return throwError(errorMessage)
  }
}
