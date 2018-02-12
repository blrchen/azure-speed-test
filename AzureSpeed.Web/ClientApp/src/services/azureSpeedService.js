
import Config from '../app.config';
import HttpClient from './httpClient';

export default class AzureSpeedService {
  static getIpRageData() {
    console.log('in AzureSpeedService');
    return HttpClient.get(`${Config.apiUrl}/api/iprange`);
  }
}