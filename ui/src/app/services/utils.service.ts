import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  getRandomBlobName() {
    const time = new Date(Date.now())
    return `${time.getFullYear()}${time.getMonth()}${time.getDate()}${time.getHours()}${time.getMinutes()}${time.getSeconds()}${time.getMilliseconds()}`
  }
}
