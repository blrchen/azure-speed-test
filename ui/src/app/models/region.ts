export interface Region {
  readonly regionId: string
  readonly displayName: string
  readonly longName: string
  readonly geography: string
  readonly geographicGroup: string
  readonly regionGroup: string
  readonly latitude: number
  readonly longitude: number
  readonly datacenterLocation: string
  readonly pairedRegion: string
  readonly availabilityZoneCount?: number
  readonly restricted: boolean
  readonly availableTo: string
  readonly dataResidency?: string
  /** Approximate operational year for the listed location, not an Azure service GA date. */
  readonly launchYear?: number
}

export interface UpcomingRegion {
  readonly regionId: string
  readonly displayName: string
  readonly geography: string
  readonly datacenterLocation: string
  readonly latitude: number
  readonly longitude: number
  readonly announcementLink: string
  readonly dataResidency: string
  readonly availableTo: string
}

export interface RegionModel extends Region {
  readonly storageAccountName: string
  readonly url?: string
}
