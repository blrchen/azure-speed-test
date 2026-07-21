import { DOCUMENT } from '@angular/common'
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core'

import { RegionModel } from '../../models'
import { RegionService, type RegionGroup } from '../../services/region.service'
import { LucideIconComponent } from '../icons/lucide-icons.component'

interface VisibleRegionGroup {
  readonly group: RegionGroup
  readonly visibleRegions: readonly RegionModel[]
}

@Component({
  selector: 'app-region-group',
  imports: [LucideIconComponent],
  templateUrl: './region-group.component.html',
  host: {
    class: 'block @container scroll-mt-[calc(env(safe-area-inset-top)+5rem)]',
  },
})
export class RegionGroupComponent {
  private readonly document = inject(DOCUMENT)
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly regionService = inject(RegionService)
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('regionSearchInput')
  private readonly statusBar = viewChild<ElementRef<HTMLElement>>('selectorStatusBar')

  readonly disabled = input(false)
  readonly excludedRegionIds = input<readonly string[]>([])
  readonly resultsTargetId = input<string | null>(null)
  readonly resultsLabel = input('View Results')
  readonly resultsAvailable = input(false)
  readonly resultsStatus = input<string | null>(null)

  protected readonly isInteractive = signal(false)
  protected readonly isCollapsed = signal(false)
  protected readonly searchQuery = signal('')
  readonly hasSearchQuery = computed(() => Boolean(this.searchQuery().trim()))
  private readonly excludedRegionIdLookup = computed(
    () => new Set(this.excludedRegionIds().map((regionId) => regionId.toLowerCase()))
  )
  private readonly allRegions = computed<readonly RegionModel[]>(() => {
    const excluded = this.excludedRegionIdLookup()
    return this.regionService
      .getAllRegions()
      .filter((region) => !excluded.has(region.regionId.toLowerCase()))
  })
  readonly selectionModel = linkedSignal(() =>
    this.buildSelectionModel(this.regionService.selectedRegions())
  )
  private readonly selectedRegionIds = computed(() => {
    const model = this.selectionModel()
    const selected = new Set<string>()
    for (const region of this.allRegions()) {
      if (model[region.regionId]) selected.add(region.regionId)
    }
    return selected
  })
  readonly regionGroups = computed<readonly RegionGroup[]>(() => {
    const allowedIds = new Set(this.allRegions().map((region) => region.regionId))
    return this.regionService
      .getRegionGroups()
      .map((group) => ({
        regionGroup: group.regionGroup,
        regions: group.regions.filter((region) => allowedIds.has(region.regionId)),
      }))
      .filter((group) => group.regions.length > 0)
  })
  readonly filteredRegionGroups = computed<readonly VisibleRegionGroup[]>(() => {
    const query = this.searchQuery().trim().toLowerCase()
    if (!query) {
      return this.regionGroups().map((group) => ({ group, visibleRegions: group.regions }))
    }

    return this.regionGroups()
      .map((group) => {
        const groupMatches = group.regionGroup.toLowerCase().includes(query)
        return {
          group,
          visibleRegions: groupMatches
            ? group.regions
            : group.regions.filter((region) => this.regionMatchesQuery(region, query)),
        }
      })
      .filter((group) => group.visibleRegions.length > 0)
  })
  readonly filteredRegionCount = computed(() =>
    this.filteredRegionGroups().reduce((count, group) => count + group.visibleRegions.length, 0)
  )
  private readonly groupSelectionLookup = computed(() => {
    const selected = this.selectedRegionIds()
    const fullySelected = new Set<string>()
    const partiallySelected = new Set<string>()
    const selectedCounts = new Map<string, number>()

    for (const group of this.regionGroups()) {
      let selectedCount = 0
      for (const region of group.regions) {
        if (selected.has(region.regionId)) selectedCount += 1
      }
      selectedCounts.set(group.regionGroup, selectedCount)
      if (selectedCount === 0) continue

      if (selectedCount === group.regions.length) fullySelected.add(group.regionGroup)
      else partiallySelected.add(group.regionGroup)
    }

    return { fullySelected, partiallySelected, selectedCounts }
  })

  readonly selectedRegionCount = computed(() => this.selectedRegionIds().size)
  readonly totalRegionCount = computed(() => this.allRegions().length)
  readonly canViewResults = computed(
    () =>
      Boolean(this.resultsTargetId()) && this.resultsAvailable() && this.selectedRegionCount() > 0
  )
  private readonly expandedRegionGroups = signal<ReadonlySet<string>>(
    new Set(
      this.regionGroups()
        .slice(0, 1)
        .map((group) => group.regionGroup)
    )
  )

  constructor() {
    afterNextRender(() => this.isInteractive.set(true))
  }

  onSearchInput(event: Event): void {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return
    this.searchQuery.set(target.value)
  }

  clearSearch(): void {
    this.searchQuery.set('')
  }

  clearSearchAndFocus(): void {
    this.clearSearch()
    this.scheduleAfterRender(() => this.searchInput()?.nativeElement.focus())
  }

  clearSelection(): void {
    if (this.disabled()) return
    this.applySelection(new Set())
  }

  handleSelectionAction(): void {
    if (this.isCollapsed()) this.showSelection()
    else this.clearSelection()
  }

  collapse(): void {
    this.isCollapsed.set(true)
  }

  showSelection(): void {
    if (this.disabled()) return

    this.isCollapsed.set(false)
    this.scheduleAfterRender(() => {
      const statusBar = this.statusBar()?.nativeElement
      statusBar?.focus({ preventScroll: true })
      this.hostElement.nativeElement.scrollIntoView({
        behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  }

  viewResults(): void {
    const targetId = this.resultsTargetId()
    if (!targetId) return

    this.collapse()
    this.focusResultsTarget(targetId)
  }

  toggleRegion(region: RegionModel): void {
    if (this.isRegionDisabled()) return

    const next = new Set(this.selectedRegionIds())
    if (next.has(region.regionId)) next.delete(region.regionId)
    else next.add(region.regionId)
    this.applySelection(next)
  }

  toggleGroup(group: RegionGroup): void {
    if (this.isGroupToggleDisabled()) return

    const next = new Set(this.selectedRegionIds())
    const groupHasSelection = group.regions.some((region) => next.has(region.regionId))

    if (groupHasSelection) {
      for (const region of group.regions) next.delete(region.regionId)
    } else {
      for (const region of group.regions) next.add(region.regionId)
    }

    this.applySelection(next)
  }

  toggleGroupExpanded(group: RegionGroup): void {
    this.expandedRegionGroups.update((expandedGroups) => {
      const next = new Set(expandedGroups)
      if (next.has(group.regionGroup)) next.delete(group.regionGroup)
      else next.add(group.regionGroup)
      return next
    })
  }

  isGroupExpanded(group: RegionGroup): boolean {
    return this.hasSearchQuery() || this.expandedRegionGroups().has(group.regionGroup)
  }

  isRegionChecked(regionId: string): boolean {
    return this.selectedRegionIds().has(regionId)
  }

  isRegionDisabled(): boolean {
    return !this.isInteractive() || this.disabled()
  }

  isGroupChecked(group: RegionGroup): boolean {
    return this.groupSelectionLookup().fullySelected.has(group.regionGroup)
  }

  isGroupIndeterminate(group: RegionGroup): boolean {
    return this.groupSelectionLookup().partiallySelected.has(group.regionGroup)
  }

  getGroupSelectedCount(group: RegionGroup): number {
    return this.groupSelectionLookup().selectedCounts.get(group.regionGroup) ?? 0
  }

  isGroupToggleDisabled(): boolean {
    return !this.isInteractive() || this.disabled()
  }

  getGroupActionAriaLabel(group: RegionGroup): string {
    if (this.getGroupSelectedCount(group) > 0) {
      return `Deselect all regions in ${group.regionGroup}`
    }
    return `Select all regions in ${group.regionGroup}`
  }

  getGroupPanelId(group: RegionGroup): string {
    return `region-group-${this.normalizeForId(group.regionGroup)}`
  }

  getGroupCheckboxId(group: RegionGroup): string {
    return `region-group-checkbox-${this.normalizeForId(group.regionGroup)}`
  }

  getRegionCheckboxId(regionId: string): string {
    return `region-checkbox-${this.normalizeForId(regionId)}`
  }

  private applySelection(next: Set<string>): void {
    const current = this.selectedRegionIds()
    if (this.areSetsEqual(current, next)) return

    this.selectionModel.set(this.buildSelectionModelFromIds(next))
    this.regionService.updateSelectedRegions(this.resolveRegionsFromIds(next))
  }

  private buildSelectionModel(selectedRegions: readonly RegionModel[]): Record<string, boolean> {
    return this.buildSelectionModelFromIds(
      new Set(selectedRegions.map((region) => region.regionId))
    )
  }

  private buildSelectionModelFromIds(regionIds: ReadonlySet<string>): Record<string, boolean> {
    return Object.fromEntries(
      this.allRegions().map((region) => [region.regionId, regionIds.has(region.regionId)])
    )
  }

  private resolveRegionsFromIds(regionIds: ReadonlySet<string>): RegionModel[] {
    return regionIds.size
      ? this.allRegions().filter((region) => regionIds.has(region.regionId))
      : []
  }

  private areSetsEqual(current: ReadonlySet<string>, next: ReadonlySet<string>): boolean {
    if (current.size !== next.size) return false
    for (const id of current) {
      if (!next.has(id)) return false
    }
    return true
  }

  private regionMatchesQuery(region: RegionModel, query: string): boolean {
    return [
      region.displayName,
      region.regionId,
      region.datacenterLocation,
      region.geography,
      region.regionGroup,
      region.longName,
    ].some((value) => value.toLowerCase().includes(query))
  }

  private normalizeForId(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }

  private focusResultsTarget(targetId: string, attemptsRemaining = 3): void {
    this.scheduleAfterRender(() => {
      const target = this.document.getElementById(targetId)
      if (!target) {
        if (attemptsRemaining > 1) {
          this.focusResultsTarget(targetId, attemptsRemaining - 1)
        }
        return
      }

      target.focus({ preventScroll: true })
      target.scrollIntoView({
        behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  }

  private scheduleAfterRender(callback: () => void): void {
    const browserWindow = this.document.defaultView
    if (!browserWindow) return
    browserWindow.requestAnimationFrame(callback)
  }

  private prefersReducedMotion(): boolean {
    return (
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false
    )
  }
}
