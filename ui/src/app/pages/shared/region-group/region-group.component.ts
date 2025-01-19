import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { RegionModel } from '../../../models'
import { RegionService } from '../../../services'

interface RegionGroupModel {
  geographyGroup: string
  regions: RegionModel[]
  checked: boolean
}

@Component({
  selector: 'app-region-group',
  templateUrl: './region-group.component.html'
})
export class RegionGroupComponent implements OnInit {
  regionGroups: RegionGroupModel[] = []
  selectedRegionCount = 0
  isInitialized = false

  constructor(
    private regionService: RegionService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return
    }

    try {
      this.initializeRegionGroups()
      this.isInitialized = true
      this.selectedRegionCount = 0
      this.regionService.updateSelectedRegions([])
    } catch (error) {
      console.error('Failed to initialize regions:', error)
    }
  }

  private initializeRegionGroups(): void {
    const allRegions = this.regionService.getAllRegions()

    if (!allRegions?.length) {
      console.warn('No regions available during initialization')
      return
    }

    // Create a safe copy of regions
    const safeRegions = allRegions.map((region) => ({
      ...region,
      checked: false
    }))

    // Get distinct geography groups safely
    const distinctGeographyGroups = Array.from(
      new Set(safeRegions.map((r) => r.geographyGroup || '').filter(Boolean))
    )

    this.regionGroups = distinctGeographyGroups
      .map((geographyGroup) => ({
        geographyGroup,
        checked: false,
        regions: safeRegions.filter((r) => r.geographyGroup === geographyGroup)
      }))
      .filter((group) => group.regions.length > 0)
      .sort((a, b) => b.regions.length - a.regions.length)
  }

  onChange(region: RegionModel | null, group: RegionGroupModel): void {
    if (!group) return

    try {
      if (region) {
        // Handle individual region selection
        region.checked = !region.checked
        group.checked = group.regions.every((r) => r.checked)
      } else {
        // Handle group selection
        const newState = !group.checked
        group.checked = newState
        group.regions.forEach((r) => (r.checked = newState))
      }

      const checkedRegions = this.getCheckedRegions()
      this.selectedRegionCount = checkedRegions.length
      this.regionService.updateSelectedRegions(checkedRegions)
    } catch (error) {
      console.error('Error in onChange:', error)
    }
  }

  private getCheckedRegions(): RegionModel[] {
    return this.regionGroups.flatMap((group) => group.regions).filter((region) => region.checked)
  }
}
