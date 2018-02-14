
import Config from '../app.config';
import HttpClient from './httpClient';

export default class AzureSpeedService {

  static getDownloadData() {
    return HttpClient.get(`${Config.apiUrl}/api/download`);
  }

  static getIpRageData() {
    return HttpClient.get(`${Config.apiUrl}/api/iprange`);
  }

  static getIpOrUrl(ipOrUrl) {
    return HttpClient.get(`${Config.apiUrl}/api/region?ipOrUrl=${ipOrUrl}`);
  }

}