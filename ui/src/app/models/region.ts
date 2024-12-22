export const DefaultRegionsKey = 'azurespeed.userSelectedRegions'

export interface Region {
  displayName: string
  geographyGroup: string
  //geography: string
  latitude?: number
  longitude?: number
  pairedRegion: string | null
  physicalLocation?: string
  name: string
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
  uploadTime?: string
}
