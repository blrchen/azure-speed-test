import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core'

import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services/seo.service'
import { buildDocumentHref } from '../../../shared/document-navigation'
import { readInputValue } from '../../../shared/form-control-value'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { AzureRegionMapViewComponent } from '../../../shared/region-map/azure-region-map-view.component'
import { buildRegionDetailHref } from '../../../shared/utils'

const ALL_GROUP = 'all'
const PAGE_DESCRIPTION =
  'Explore Azure regions around the world and find locations that support your deployment strategy. Map locations are approximate and do not identify individual facilities.'

const GROUP_ORDER = [
  'North America',
  'Europe',
  'Asia',
  'Australia and New Zealand',
  'Middle East and Africa',
  'South America',
] as const

const GROUP_LABELS: Record<string, string> = {
  [ALL_GROUP]: 'All',
  'Australia and New Zealand': 'Australia & NZ',
  'Middle East and Africa': 'MEA',
  'South America': 'South Am.',
}

interface RegionGroupOption {
  readonly id: string
  readonly label: string
  readonly count: number
}

type AzureRegionToolbarPanel = 'legend' | null

interface RegionMapLegendItem {
  readonly label: string
  readonly countLabel: string
  readonly tone: 'region' | 'selected'
}

const PUBLIC_REGIONS = (azureGlobalCloudRegionsJson as Region[]).filter(
  (region) => !region.restricted
)

const getAvailabilityZoneCount = (region: Region): number => region.availabilityZoneCount ?? 0

@Component({
  selector: 'app-azure-region-map',
  imports: [LucideIconComponent, AzureRegionMapViewComponent],
  templateUrl: './azure-region-map.component.html',
  styleUrl: './azure-region-map.component.css',
  host: { class: 'block' },
})
export class AzureRegionMapComponent implements OnInit {
  readonly buildDocumentHref = buildDocumentHref
  private readonly seoService = inject(SeoService)
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly legendTrigger = viewChild<ElementRef<HTMLButtonElement>>('legendTrigger')

  readonly regions = PUBLIC_REGIONS
  readonly filtersModel = signal({ search: '' })
  readonly selectedGroup = signal<string>(ALL_GROUP)
  readonly selectedRegionId = signal<string | null>(null)
  readonly activeRegionId = signal<string | null>(null)
  readonly focusedListRegionId = signal<string | null>(null)
  readonly activeToolbarPanel = signal<AzureRegionToolbarPanel>(null)

  readonly regionGroups = computed<RegionGroupOption[]>(() => {
    const counts = new Map<string, number>()
    for (const region of this.regions) {
      counts.set(region.regionGroup, (counts.get(region.regionGroup) ?? 0) + 1)
    }

    const orderedGroups = GROUP_ORDER.filter((group) => counts.has(group)).map((group) => ({
      id: group,
      label: GROUP_LABELS[group] ?? group,
      count: counts.get(group) ?? 0,
    }))

    return [
      {
        id: ALL_GROUP,
        label: GROUP_LABELS[ALL_GROUP],
        count: this.regions.length,
      },
      ...orderedGroups,
    ]
  })

  readonly legendItems = computed<readonly RegionMapLegendItem[]>(() => [
    {
      label: 'Azure region',
      countLabel: `${this.filteredRegions().length}`,
      tone: 'region',
    },
    {
      label: 'Selected or previewed',
      countLabel: this.previewRegion()?.displayName ?? 'None',
      tone: 'selected',
    },
  ])

  readonly filteredRegions = computed(() => {
    const selectedGroup = this.selectedGroup()
    const normalizedSearch = this.filtersModel().search.trim().toLowerCase()

    return this.regions.filter((region) => {
      if (selectedGroup !== ALL_GROUP && region.regionGroup !== selectedGroup) return false
      if (!normalizedSearch) return true

      return [
        region.regionId,
        region.displayName,
        region.datacenterLocation,
        region.geography,
        region.regionGroup,
      ].some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  })

  readonly hasSearchQuery = computed(() => !!this.filtersModel().search.trim())
  readonly shouldFitMap = computed(
    () => this.selectedGroup() !== ALL_GROUP || this.hasSearchQuery()
  )

  readonly selectedRegion = computed(() => {
    const selectedRegionId = this.selectedRegionId()
    if (!selectedRegionId) return null

    return this.regions.find((region) => region.regionId === selectedRegionId) ?? null
  })

  readonly previewRegion = computed(() => {
    const activeRegionId = this.activeRegionId()
    if (!activeRegionId) return this.selectedRegion()

    return this.filteredRegions().find((region) => region.regionId === activeRegionId) ?? null
  })

  readonly isPreviewingRegion = computed(() => {
    const activeRegionId = this.activeRegionId()
    return !!activeRegionId && activeRegionId !== this.selectedRegionId()
  })

  readonly selectedRegionDetailHref = computed(() => {
    const selectedRegion = this.selectedRegion()
    return selectedRegion ? buildRegionDetailHref(selectedRegion.displayName) : null
  })

  readonly selectedLatencyQueryParams = computed(() => {
    const selectedRegion = this.selectedRegion()
    return selectedRegion ? { regions: selectedRegion.regionId } : {}
  })

  readonly selectedRegionAnnouncement = computed(() => {
    const selectedRegion = this.selectedRegion()
    if (!selectedRegion) return 'No Azure region selected.'

    return `${selectedRegion.displayName}, ${selectedRegion.datacenterLocation}, selected.`
  })

  readonly listTabStopRegionId = computed(() => {
    const regions = this.filteredRegions()
    if (!regions.length) return null

    const focusedRegionId = this.focusedListRegionId()
    if (focusedRegionId && regions.some((region) => region.regionId === focusedRegionId)) {
      return focusedRegionId
    }

    const selectedRegionId = this.selectedRegionId()
    if (selectedRegionId && regions.some((region) => region.regionId === selectedRegionId)) {
      return selectedRegionId
    }

    return regions[0].regionId
  })

  readonly regionCountLabel = computed(() => {
    const count = this.filteredRegions().length
    const selectedGroup = this.selectedGroup()
    const groupPart = selectedGroup === ALL_GROUP ? '' : ` in ${selectedGroup}`

    if (this.hasSearchQuery()) {
      return `${count} matching ${count === 1 ? 'region' : 'regions'}${groupPart}`
    }

    return `${count} Azure regions${groupPart}`
  })

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Azure Region Map: Global Cloud Locations',
      description: PAGE_DESCRIPTION,
      canonicalUrl: 'https://www.azurespeed.com/Information/AzureRegionMap',
    })
  }

  selectGroup(groupId: string): void {
    this.selectedGroup.set(groupId)
    this.activeRegionId.set(null)
    this.focusedListRegionId.set(null)

    const selectedRegion = this.selectedRegion()
    if (selectedRegion && groupId !== ALL_GROUP && selectedRegion.regionGroup !== groupId) {
      this.selectedRegionId.set(null)
    }
  }

  selectGroupFromControl(event: Event): void {
    const target = event.target
    if (!(target instanceof HTMLSelectElement)) return

    this.selectGroup(target.value)
  }

  updateSearch(event: Event): void {
    this.filtersModel.set({ search: readInputValue(event) })
  }

  toggleToolbarPanel(panel: Exclude<AzureRegionToolbarPanel, null>): void {
    this.activeToolbarPanel.update((activePanel) => (activePanel === panel ? null : panel))
  }

  closeToolbarPanel(): void {
    this.activeToolbarPanel.set(null)
    this.legendTrigger()?.nativeElement.focus()
  }

  selectRegion(region: Region): void {
    this.selectedRegionId.set(region.regionId)
    this.activeRegionId.set(null)
    this.focusedListRegionId.set(region.regionId)
  }

  activateRegion(region: Region): void {
    this.activeRegionId.set(region.regionId)
  }

  focusListRegion(region: Region): void {
    this.focusedListRegionId.set(region.regionId)
    this.activateRegion(region)
  }

  clearActiveRegion(): void {
    this.activeRegionId.set(null)
  }

  isPreviewRegion(region: Region): boolean {
    return this.previewRegion()?.regionId === region.regionId
  }

  isSelectedRegion(region: Region): boolean {
    return this.selectedRegionId() === region.regionId
  }

  isListTabStop(region: Region): boolean {
    return this.listTabStopRegionId() === region.regionId
  }

  handleListKeydown(event: KeyboardEvent, region: Region): void {
    const regions = this.filteredRegions()
    if (!regions.length) return

    const currentIndex = regions.findIndex((candidate) => candidate.regionId === region.regionId)
    if (currentIndex < 0) return

    let nextIndex: number
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % regions.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + regions.length) % regions.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = regions.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    const nextRegion = regions[nextIndex]
    this.focusListRegion(nextRegion)
    this.focusRegionListItem(nextRegion.regionId)
  }

  clearSearch(): void {
    this.filtersModel.set({ search: '' })
    this.activeRegionId.set(null)
    this.focusedListRegionId.set(null)
    queueMicrotask(() => {
      this.hostElement.nativeElement.querySelector<HTMLInputElement>('#azure-map-search')?.focus()
    })
  }

  clearFilters(): void {
    this.filtersModel.set({ search: '' })
    this.selectedGroup.set(ALL_GROUP)
    this.activeRegionId.set(null)
    this.focusedListRegionId.set(null)
  }

  formatCoordinates(region: Region): string {
    return `${region.latitude.toFixed(3)}, ${region.longitude.toFixed(3)}`
  }

  regionStatusLabel(region: Region): string {
    const availabilityZoneCount = getAvailabilityZoneCount(region)
    if (availabilityZoneCount > 0) return `${availabilityZoneCount} availability zones`

    return 'No availability zones'
  }

  private focusRegionListItem(regionId: string): void {
    queueMicrotask(() => {
      this.hostElement.nativeElement
        .querySelector<HTMLElement>(`[data-region-list-id="${regionId}"]`)
        ?.focus()
    })
  }
}
