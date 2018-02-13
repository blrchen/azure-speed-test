
import Config from '../app.config';
import HttpClient from './httpClient';

export default class AzureSpeedService {
  static getIpRageData() {
    return HttpClient.get(`${Config.apiUrl}/api/iprange`);
  }
}