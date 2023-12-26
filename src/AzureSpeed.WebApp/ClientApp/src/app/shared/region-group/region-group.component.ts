import { Component, OnInit } from '@angular/core'
import { RegionService } from 'src/app/services'
import { DefaultRegionsKey, RegionModel } from 'src/app/models'

interface RegionGroupModel {
  geography: string
  regions: RegionModel[]
  checked?: boolean
}

@Component({
  selector: 'app-region-group',
  templateUrl: './region-group.component.html'
})
export class RegionsComponent implements OnInit {
  regionsGroup: RegionGroupModel[] = []
  totalCheckedRegions = 0

  constructor(private regionService: RegionService) {
    const groups = this.regionService.getAllRegions().reduce((arr, item) => {
      if (!arr.includes(item.geography)) {
        arr.push(item.geography)
      }
      return arr
    }, [])

    this.regionsGroup = groups
      .reduce((arr, geography) => {
        const regions = this.regionService
          .getAllRegions()
          .filter((i) => i.geography === geography)
          .map((i) => ({ ...i, checked: false }))

        arr.push({ geography, checked: false, regions })
        return arr
      }, [])
      .sort((a, b) => {
        return b.regions.length - a.regions.length
      })
  }

  ngOnInit() {
    this.initRegions()
  }

  onChange(region: RegionModel, group: RegionGroupModel) {
    if (region) {
      this.checkRegion(region, group)
    } else {
      this.checkGroup(group)
    }

    const checkedRegions = this.getCheckedRegions()
    this.regionService.updateRegions(checkedRegions)
  }

  initRegions() {
    const res = localStorage.getItem(DefaultRegionsKey)
    const defaultRegions: RegionModel[] = res ? JSON.parse(res) : []

    if (Array.isArray(defaultRegions)) {
      this.regionsGroup.forEach((group) => {
        let isGroupChecked = true

        group.regions.forEach((item) => {
          const isDefault = defaultRegions.some(
            (i) => i.storageAccountName === item.storageAccountName
          )

          if (isDefault) {
            item.checked = true
            this.totalCheckedRegions++
          }

          if (!item.checked) {
            isGroupChecked = false
          }
        })

        group.checked = isGroupChecked
      })
    }
  }

  private checkRegion(region: RegionModel, group: RegionGroupModel) {
    const { checked } = region

    if (checked) {
      group.checked = group.regions.every((element) => element.checked)
    } else {
      group.checked = false
    }
  }

  private checkGroup(group: RegionGroupModel) {
    const { checked, regions } = group
    regions.forEach((i) => {
      i.checked = checked
    })
  }

  private getCheckedRegions() {
    return this.regionsGroup.reduce((arr, group) => {
      group.regions.forEach((region) => {
        if (region.checked) {
          arr.push(region)
        }
      })

      this.totalCheckedRegions = arr.length
      return arr
    }, [])
  }
}
