export const DefaultRegionsKey = "azurespeed.userSelectedRegions";

export interface Region {
  availabilityZoneCount?: number;
  availabilityZoneStatus?: string;
  displayName: string;
  geography: string;
  latitude?: string;
  longitude?: string;
  pairedRegion?: string;
  physicalLocation?: string;
  regionalDisplayName?: string;
  regionName: string;
  accessEnabled: boolean;
  storageAccountName: string;
}

export interface RegionModel extends Region {
  averageLatency?: number;
  checked?: boolean;
  url?: string;
}

export interface RegionGroupModel {
  geography: string;
  regions: RegionModel[];
  checked?: boolean;
}

export interface HistoryModel {
  [key: string]: any[];
}

export interface BlobModel {
  endpoint: string;
  accountName: string;
  containerName: string;
  blobName: string;
  sas: string;
}

export interface BlobUploadSpeedModel {
  fileName: any;
  fileSize: string;
  region: string;
  thread: number;
  blockSize: number;
  uploadSpeed: string;
}
