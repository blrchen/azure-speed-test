export interface Region {
  displayName: string
  geography: string
  geographyGroup: string
  latitude: number
  longitude: number
  pairedRegion: string | null
  physicalLocation: string
  name: string
  availabilityZoneCount?: number
  restricted: boolean
  yearOpen?: number
}

export interface RegionModel extends Region {
  checked?: boolean
  storageAccountName: string
  url?: string
}
