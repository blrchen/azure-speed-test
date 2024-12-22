import { Component, OnInit } from '@angular/core'
import { DefaultRegionsKey, RegionModel } from '../../../models'
import { RegionService } from '../../../services'

interface RegionGroupModel {
  geographyGroup: string
  regions: RegionModel[]
  checked?: boolean
}

@Component({
  selector: 'app-region-group',
  templateUrl: './region-group.component.html'
})
export class RegionGroupComponent implements OnInit {
  regionGroups: RegionGroupModel[] = []
  totalCheckedRegions = 0

  constructor(private regionService: RegionService) {
    const distinctGeographies = this.regionService
      .getAllRegions()
      .reduce((geographies: string[], region) => {
        if (!geographies.includes(region.geographyGroup)) {
          geographies.push(region.geographyGroup)
        }
        return geographies
      }, [])

    this.regionGroups = distinctGeographies
      .reduce((arr: RegionGroupModel[], geographyGroup: string) => {
        const regions = this.regionService
          .getAllRegions()
          .filter((_) => _.geographyGroup === geographyGroup)
          .map((_) => ({ ..._, checked: false }))

        arr.push({ geographyGroup, checked: false, regions })
        return arr
      }, [])
      .sort((a, b) => {
        return b.regions.length - a.regions.length
      })
  }

  ngOnInit() {
    this.initializeRegions()
  }

  onChange(region: RegionModel | null, group: RegionGroupModel) {
    if (region) {
      this.updateRegionCheckStatus(region, group)
    } else {
      this.updateGroupCheckStatus(group)
    }

    const checkedRegions = this.getCheckedRegions()
    this.regionService.updateSelectedRegions(checkedRegions)
  }

  private initializeRegions() {
    const storedRegions = localStorage.getItem(DefaultRegionsKey)
    const defaultRegions: RegionModel[] = storedRegions ? JSON.parse(storedRegions) : []

    if (Array.isArray(defaultRegions)) {
      this.regionGroups.forEach((group) => {
        let isGroupChecked = true

        group.regions.forEach((region) => {
          const isDefault = defaultRegions.some((_) => _.name === region.name)
          if (isDefault) {
            region.checked = true
            this.totalCheckedRegions++
          }
          if (!region.checked) {
            isGroupChecked = false
          }
        })
        group.checked = isGroupChecked
      })
    }
  }

  private updateRegionCheckStatus(region: RegionModel, group: RegionGroupModel) {
    const { checked } = region
    if (checked) {
      group.checked = group.regions.every((_) => _.checked)
    } else {
      group.checked = false
    }
  }

  private updateGroupCheckStatus(group: RegionGroupModel) {
    const { checked, regions } = group
    regions.forEach((_) => {
      _.checked = checked
    })
  }

  private getCheckedRegions(): RegionModel[] {
    return this.regionGroups.reduce((checkedRegions: RegionModel[], group: RegionGroupModel) => {
      group.regions.forEach((region) => {
        if (region.checked) {
          checkedRegions.push(region)
        }
      })
      this.totalCheckedRegions = checkedRegions.length
      return checkedRegions
    }, [])
  }
}
