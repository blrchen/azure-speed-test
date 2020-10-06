export const DefaultRegionsKey = "azurespeed.userSelectedRegions";

export interface RegionModel {
  averageLatency?: number;
  checked?: boolean;
  displayName: string;
  geography: string;
  latitude?: string;
  longitude?: string;
  pairedRegion?: string;
  physicalLocation?: string;
  regionalDisplayName?: string;
  regionName: string;
  storageAccountName: string;
  url?: string;
}

export interface RegionGroupModel {
  geography: string;
  regions: RegionModel[];
  checked?: boolean;
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
