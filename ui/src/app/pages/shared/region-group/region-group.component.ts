import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'

import { RegionModel } from '../../../models'
import { RegionGroup, RegionService } from '../../../services'

interface GroupSelectionLookup {
  fullySelected: Set<string>
  partiallySelected: Set<string>
}

@Component({
  selector: 'app-region-group',
  templateUrl: './region-group.component.html',
  styleUrl: './region-group.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegionGroupComponent {
  private readonly regionService = inject(RegionService)
  private readonly allRegions: RegionModel[] = this.regionService.getAllRegions()
  private readonly selectedRegionIds = computed<Set<string>>(() => {
    const selectedRegions = this.regionService.selectedRegions()
    return new Set(selectedRegions.map((region) => region.regionId))
  })
  readonly regionGroups: RegionGroup[] = this.regionService.getRegionGroups()
  private readonly groupSelectionLookup = computed<GroupSelectionLookup>(() => {
    const selected = this.selectedRegionIds()
    const fullySelected = new Set<string>()
    const partiallySelected = new Set<string>()

    for (const group of this.regionGroups) {
      let selectedCount = 0
      for (const region of group.regions) {
        if (selected.has(region.regionId)) {
          selectedCount += 1
        }
      }

      if (selectedCount === 0) {
        continue
      }

      if (selectedCount === group.regions.length) {
        fullySelected.add(group.regionGroup)
      } else {
        partiallySelected.add(group.regionGroup)
      }
    }

    return { fullySelected, partiallySelected }
  })

  readonly trackByGroup = (_index: number, group: RegionGroup): string => group.regionGroup
  readonly trackByRegion = (_index: number, region: RegionModel): string => region.regionId

  readonly selectedRegionCount = computed(() => this.selectedRegionIds().size)
  readonly totalRegionCount = this.allRegions.length

  clearSelection(): void {
    const current = this.selectedRegionIds()
    if (!current.size) {
      return
    }
    this.applySelection(new Set())
  }

  onChange(region: RegionModel | null, group: RegionGroup): void {
    if (!group) return

    const next = new Set(this.selectedRegionIds())

    if (region) {
      if (next.has(region.regionId)) {
        next.delete(region.regionId)
      } else {
        next.add(region.regionId)
      }
      this.applySelection(next)
      return
    }

    const allSelected = group.regions.every((r) => next.has(r.regionId))
    for (const entry of group.regions) {
      if (allSelected) {
        next.delete(entry.regionId)
      } else {
        next.add(entry.regionId)
      }
    }

    this.applySelection(next)
  }

  isRegionChecked(regionId: string): boolean {
    return this.selectedRegionIds().has(regionId)
  }

  isGroupChecked(group: RegionGroup): boolean {
    return this.groupSelectionLookup().fullySelected.has(group.regionGroup)
  }

  isGroupIndeterminate(group: RegionGroup): boolean {
    return this.groupSelectionLookup().partiallySelected.has(group.regionGroup)
  }

  private applySelection(next: Set<string>): void {
    const current = this.selectedRegionIds()
    if (this.areSetsEqual(current, next)) {
      return
    }
    this.syncRegionService(next)
  }

  private syncRegionService(selection: Set<string>): void {
    const selectedRegions = selection.size
      ? this.allRegions.filter((region) => selection.has(region.regionId))
      : []
    this.regionService.updateSelectedRegions(selectedRegions)
  }

  private areSetsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) {
      return false
    }
    for (const value of a) {
      if (!b.has(value)) {
        return false
      }
    }
    return true
  }
}
