export const DefaultRegionsKey = "azurespeed.userSelectedRegions";

export interface RegionModel {
  id: number;
  locationId: string;
  name: string;
  storageAccountName: string;
  location: string;
  geography: string;
  geographyGrouping: string;
  checked?: boolean;
}

export interface RegionGroupModel {
  geographyGrouping: string;
  locations: RegionModel[];
  checked?: boolean;
}
