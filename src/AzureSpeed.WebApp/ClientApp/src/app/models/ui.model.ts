export const DefaultRegionsKey = 'azurespeed.userSelectedRegions'

export interface Region {
  displayName: string
  geography: string
  latitude?: number
  longitude?: number
  pairedRegion?: string
  physicalLocation?: string
  regionName: string
  availabilityZoneCount?: number
  restricted: boolean
}

export interface RegionModel extends Region {
  averageLatency?: number
  checked?: boolean
  storageAccountName?: string
  url?: string
  progress?: string
  speed?: string
}

export interface BlobModel {
  endpoint: string
  accountName: string
  containerName: string
  blobName: string
  sas: string
}
