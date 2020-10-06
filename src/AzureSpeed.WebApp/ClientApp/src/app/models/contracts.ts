export interface IpInfo {
  serviceTagId: string;
  ipAddress: string;
  ipAddressPrefix: string;
  region: string;
  systemService: string;
}

// To be deprecated
export interface IpRangeInfo {
  cloud: string;
  regionId: string;
  region: string;
  location: string;
  ipAddress: string;
}

export interface SasUrlInfo {
  url: string;
}
