// Base interface matching the structure of regions.json
export interface Region {
  regionId: string
  displayName: string
  longName: string
  geography: string
  geographicGroup: string
  regionGroup: string
  latitude: number
  longitude: number
  datacenterLocation: string
  pairedRegion: string
  availabilityZoneCount?: number
  restricted: boolean
  availableTo: string
  dataResidency?: string
  launchYear?: number
}

// Extended interface with additional fields for application use
export interface RegionModel extends Region {
  storageAccountName: string
  url?: string
}
