import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { RegionModel } from '../../../models'
import { RegionService } from '../../../services'

interface RegionGroup {
  regionGroup: string
  regions: RegionModel[]
}

interface GroupSelectionLookup {
  fullySelected: Set<string>
  partiallySelected: Set<string>
}

@Component({
  selector: 'app-region-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './region-group.component.html',
  styleUrl: './region-group.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegionGroupComponent implements OnDestroy {
  private readonly regionService = inject(RegionService)
  private readonly allRegions: RegionModel[] = this.regionService.getAllRegions()
  private readonly selectedRegionIds = signal<Set<string>>(new Set())
  readonly regionGroups: RegionGroup[] = this.buildRegionGroups(this.allRegions)
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

  private readonly _syncFromServiceEffect = effect(
    () => {
      const regions = this.regionService.selectedRegions()
      const ids = new Set(regions.map((region) => region.regionId))
      const current = this.selectedRegionIds()
      if (this.areSetsEqual(current, ids)) {
        return
      }
      this.selectedRegionIds.set(ids)
    },
    { allowSignalWrites: true }
  )

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
    this.selectedRegionIds.set(next)
    const selectedRegions = this.allRegions.filter((region) => next.has(region.regionId))
    this.regionService.updateSelectedRegions(selectedRegions)
  }

  ngOnDestroy(): void {
    this._syncFromServiceEffect.destroy()
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

  private buildRegionGroups(regions: RegionModel[]): RegionGroup[] {
    const groupsByName = new Map<string, RegionModel[]>()

    for (const region of regions) {
      const key = region.regionGroup
      if (!key) continue

      const group = groupsByName.get(key)
      if (group) {
        group.push(region)
      } else {
        groupsByName.set(key, [region])
      }
    }

    return Array.from(groupsByName.entries())
      .map(([regionGroup, groupedRegions]) => ({
        regionGroup,
        regions: [...groupedRegions].sort((a, b) => a.regionId.localeCompare(b.regionId))
      }))
      .sort((a, b) => b.regions.length - a.regions.length)
  }
}
