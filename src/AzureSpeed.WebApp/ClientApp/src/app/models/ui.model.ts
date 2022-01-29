export const DefaultRegionsKey = "azurespeed.userSelectedRegions";

export class Region {
  availabilityZoneCount?: number;
  displayName: string;
  geography: string;
  latitude?: string;
  longitude?: string;
  pairedRegion?: string;
  physicalLocation?: string;
  regionalDisplayName?: string;
  regionName: string;
  restricted: boolean;
  accessEnabled: boolean;
}

export class RegionModel extends Region {
  averageLatency?: number;
  checked?: boolean;
  storageAccountName: string;
  url?: string;

  constructor(region: Region) {
    super();
    Object.assign(this, region);
  }
}

export class RegionGroupModel {
  geography: string;
  regions: RegionModel[];
  checked?: boolean;
}

export class HistoryModel {
  [key: string]: any[];
}

export class BlobModel {
  endpoint: string;
  accountName: string;
  containerName: string;
  blobName: string;
  sas: string;
}

export class BlobUploadSpeedModel {
  fileName: any;
  fileSize: string;
  region: string;
  thread: number;
  blockSize: number;
  uploadSpeed: string;
}
