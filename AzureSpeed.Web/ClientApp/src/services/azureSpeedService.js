
import Config from '../app.config';
import HttpClient from './httpClient';

export default class AzureSpeedService {

  static getLatencyData(region) {
    return HttpClient.get(`https://${region}.blob.core.chinacloudapi.cn/test/cb.js`);
  }

  static getDownloadData() {
    return HttpClient.get(`${Config.apiUrl}/api/download`);
  }

  static getUploadData() {
    return HttpClient.get(`${Config.apiUrl}/api/sas?blobName=1&operation=upload&region=China+East`);
  }

  static getUploadLargeFileData(region, blobName, operation) {
    return HttpClient.get(`${Config.apiUrl}/api/sas?blobName=${blobName}&operation=${operation}&region=${region}`);
  }

  static getIpRageData() {
    return HttpClient.get(`${Config.apiUrl}/api/iprange`);
  }

  static getIpOrUrl(ipOrUrl) {
    return HttpClient.get(`${Config.apiUrl}/api/region?ipOrUrl=${ipOrUrl}`);
  }

}