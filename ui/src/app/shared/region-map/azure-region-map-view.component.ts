import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core'

import { Region } from '../../models'
import {
  COUNTRY_BORDER_PATH,
  LAND_PATH,
  MAP_HEIGHT,
  MAP_WIDTH,
  REGION_MAP_POINTS,
  SPHERE_PATH,
} from './world-map-data'

type AzureRegionMapMode = 'all-regions' | 'single-region'

interface RegionMapPoint {
  readonly region: Region
  readonly x: number
  readonly y: number
  readonly transform: string
  readonly labelAnchor: 'start' | 'middle' | 'end'
  readonly labelX: number
  readonly labelY: number
}

interface MapViewport {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

interface LabelBounds {
  readonly left: number
  readonly right: number
  readonly top: number
  readonly bottom: number
}

const MAP_ASPECT_RATIO = MAP_WIDTH / MAP_HEIGHT
const WORLD_VIEWPORT: MapViewport = { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT }
const FOCUS_PADDING = 52
const MIN_FOCUS_WIDTH = 240
const MIN_FOCUS_HEIGHT = MIN_FOCUS_WIDTH / MAP_ASPECT_RATIO
const SINGLE_REGION_MARKER_SCALE = 3.2

const DEFAULT_LABEL_PLACEMENT = {
  anchor: 'middle',
  x: 0,
  y: -14,
} as const

const LABEL_PLACEMENTS: Record<
  string,
  { readonly anchor: 'start' | 'middle' | 'end'; readonly x: number; readonly y: number }
> = {
  canadacentral: { anchor: 'end', x: -8, y: -17 },
  canadaeast: { anchor: 'start', x: 9, y: -18 },
  centralus: { anchor: 'middle', x: -2, y: 19 },
  eastus: { anchor: 'start', x: 12, y: -1 },
  eastus2: { anchor: 'start', x: 10, y: 12 },
  mexicocentral: { anchor: 'middle', x: 0, y: 19 },
  northcentralus: { anchor: 'end', x: -10, y: -8 },
  southcentralus: { anchor: 'end', x: -9, y: 14 },
  westcentralus: { anchor: 'end', x: -9, y: -8 },
  westus: { anchor: 'end', x: -10, y: 0 },
  westus2: { anchor: 'end', x: -8, y: -18 },
  westus3: { anchor: 'end', x: -9, y: 15 },
}

const MARKER_OFFSETS: Record<string, { readonly x: number; readonly y: number }> = {
  austriaeast: { x: 18, y: 16 },
  centralus: { x: -2, y: 10 },
  eastus: { x: -9, y: 7 },
  eastus2: { x: 9, y: -7 },
  francecentral: { x: -22, y: 22 },
  germanywestcentral: { x: 4, y: -16 },
  northcentralus: { x: 7, y: -7 },
  northeurope: { x: -24, y: -10 },
  norwayeast: { x: -8, y: -9 },
  polandcentral: { x: 10, y: -6 },
  swedencentral: { x: 9, y: 5 },
  switzerlandnorth: { x: 2, y: 8 },
  ukwest: { x: -18, y: -6 },
  westeurope: { x: -6, y: 24 },
}

@Component({
  selector: 'app-azure-region-map-view',
  templateUrl: './azure-region-map-view.component.html',
  styleUrl: './azure-region-map-view.component.css',
  host: { class: 'block azure-map-view-host' },
})
export class AzureRegionMapViewComponent {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef)

  readonly regions = input.required<readonly Region[]>()
  readonly selectedRegionId = input<string | null>(null)
  readonly activeRegionId = input<string | null>(null)
  readonly fitToRegions = input(false)
  readonly mode = input<AzureRegionMapMode>('all-regions')
  readonly interactive = input(true)
  readonly ariaLabel = input(
    'Interactive world map of Azure regions. Use arrow keys to move between markers and Enter or Space to select.'
  )
  readonly ariaDescribedBy = input<string | null>(null)

  readonly regionSelected = output<Region>()
  readonly regionPreviewed = output<Region>()
  readonly regionPreviewCleared = output<void>()

  readonly renderMap = signal(false)
  readonly keyboardFocusedRegionId = signal<string | null>(null)
  readonly spherePath = SPHERE_PATH
  readonly landPath = LAND_PATH
  readonly countryBorderPath = COUNTRY_BORDER_PATH

  readonly mapPoints = computed<RegionMapPoint[]>(() =>
    this.regions()
      .map((region) => this.buildMapPoint(region))
      .filter((point): point is RegionMapPoint => point !== null)
  )

  readonly isFocusedView = computed(() => this.fitToRegions() || this.mode() === 'single-region')
  readonly viewport = computed(() => this.buildViewport(this.mapPoints()))
  readonly viewBox = computed(() => {
    const viewport = this.viewport()
    return `${viewport.x.toFixed(2)} ${viewport.y.toFixed(2)} ${viewport.width.toFixed(2)} ${viewport.height.toFixed(2)}`
  })
  readonly markerScale = computed(() => {
    const scale = this.viewport().width / MAP_WIDTH
    return this.mode() === 'single-region' ? scale * SINGLE_REGION_MARKER_SCALE : scale
  })
  readonly labelFontSize = computed(() => 9 * this.markerScale())
  readonly activeLabelFontSize = computed(() => 11 * this.markerScale())
  readonly previewRegionId = computed(() => this.activeRegionId() ?? this.selectedRegionId())
  readonly markerTabStopRegionId = computed(() => {
    const points = this.mapPoints()
    if (!points.length) return null

    const keyboardFocusedRegionId = this.keyboardFocusedRegionId()
    if (
      keyboardFocusedRegionId &&
      points.some((point) => point.region.regionId === keyboardFocusedRegionId)
    ) {
      return keyboardFocusedRegionId
    }

    const selectedRegionId = this.selectedRegionId()
    if (selectedRegionId && points.some((point) => point.region.regionId === selectedRegionId)) {
      return selectedRegionId
    }

    return points[0].region.regionId
  })
  readonly visibleLabelRegionIds = computed<ReadonlySet<string>>(() => {
    const points = this.mapPoints()
    const selectedRegionId = this.selectedRegionId()
    const activeRegionId = this.activeRegionId()
    const priorityRegionIds = [
      ...new Set(
        [activeRegionId, selectedRegionId].filter((regionId): regionId is string => !!regionId)
      ),
    ]
    const visibleRegionIds = new Set<string>()

    if (!this.isFocusedView()) {
      for (const regionId of priorityRegionIds) {
        if (points.some((point) => point.region.regionId === regionId)) {
          visibleRegionIds.add(regionId)
        }
      }
      return visibleRegionIds
    }

    const priorityPoints = priorityRegionIds
      .map((regionId) => points.find((point) => point.region.regionId === regionId))
      .filter((point): point is RegionMapPoint => !!point)
    const remainingPoints = points.filter(
      (point) => !priorityRegionIds.includes(point.region.regionId)
    )
    const placedLabels: LabelBounds[] = []

    for (const point of [...priorityPoints, ...remainingPoints]) {
      const bounds = this.estimateLabelBounds(point)
      const isPriority = priorityRegionIds.includes(point.region.regionId)
      const overlapsPlacedLabel = placedLabels.some((placed) => this.boundsOverlap(bounds, placed))

      if (!isPriority && overlapsPlacedLabel) continue

      visibleRegionIds.add(point.region.regionId)
      placedLabels.push(bounds)
    }

    return visibleRegionIds
  })

  constructor() {
    afterNextRender(() => {
      this.renderMap.set(true)
    })
  }

  selectRegion(region: Region): void {
    if (!this.interactive()) return
    this.regionSelected.emit(region)
  }

  previewRegion(region: Region): void {
    if (!this.interactive()) return
    this.regionPreviewed.emit(region)
  }

  focusRegion(region: Region): void {
    if (!this.interactive()) return
    this.keyboardFocusedRegionId.set(region.regionId)
    this.previewRegion(region)
  }

  clearPreviewRegion(): void {
    if (!this.interactive()) return
    this.regionPreviewCleared.emit()
  }

  handleMarkerKeydown(event: KeyboardEvent, region: Region): void {
    if (!this.interactive()) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.selectRegion(region)
      return
    }

    const points = this.mapPoints()
    if (!points.length) return

    const currentIndex = points.findIndex((point) => point.region.regionId === region.regionId)
    if (currentIndex < 0) return

    let nextIndex: number
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % points.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + points.length) % points.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = points.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    const nextRegion = points[nextIndex].region
    this.focusRegion(nextRegion)
    this.focusMarker(nextRegion.regionId)
  }

  isPreviewRegion(region: Region): boolean {
    return this.previewRegionId() === region.regionId
  }

  isSelectedRegion(region: Region): boolean {
    return this.selectedRegionId() === region.regionId
  }

  isMarkerTabStop(region: Region): boolean {
    return this.markerTabStopRegionId() === region.regionId
  }

  isLabelVisible(region: Region): boolean {
    return this.visibleLabelRegionIds().has(region.regionId)
  }

  scaledLabelX(point: RegionMapPoint): number {
    return point.labelX * this.markerScale()
  }

  scaledLabelY(point: RegionMapPoint): number {
    return point.labelY * this.markerScale()
  }

  scaledLabelFontSize(region: Region): number {
    return this.isPreviewRegion(region) || this.isSelectedRegion(region)
      ? this.activeLabelFontSize()
      : this.labelFontSize()
  }

  private buildMapPoint(region: Region): RegionMapPoint | null {
    // Positions are precomputed at build time (scripts/generate-world-map-paths.js). A missing
    // entry means the region has no usable coordinates, so it simply gets no marker.
    const projected = REGION_MAP_POINTS[region.regionId]
    if (!projected) return null

    const isSingleRegion = this.mode() === 'single-region'
    const labelPlacement = isSingleRegion
      ? DEFAULT_LABEL_PLACEMENT
      : (LABEL_PLACEMENTS[region.regionId] ?? DEFAULT_LABEL_PLACEMENT)
    const markerOffset = isSingleRegion
      ? { x: 0, y: 0 }
      : (MARKER_OFFSETS[region.regionId] ?? { x: 0, y: 0 })
    const x = projected[0] + markerOffset.x
    const y = projected[1] + markerOffset.y

    return {
      region,
      x,
      y,
      transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
      labelAnchor: labelPlacement.anchor,
      labelX: labelPlacement.x,
      labelY: labelPlacement.y,
    }
  }

  private buildViewport(points: readonly RegionMapPoint[]): MapViewport {
    if (!this.isFocusedView() || !points.length) return WORLD_VIEWPORT

    const minX = Math.min(...points.map((point) => point.x))
    const maxX = Math.max(...points.map((point) => point.x))
    const minY = Math.min(...points.map((point) => point.y))
    const maxY = Math.max(...points.map((point) => point.y))
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    let width = Math.max(maxX - minX + FOCUS_PADDING * 2, MIN_FOCUS_WIDTH)
    let height = Math.max(maxY - minY + FOCUS_PADDING * 2, MIN_FOCUS_HEIGHT)

    if (width / height < MAP_ASPECT_RATIO) {
      width = height * MAP_ASPECT_RATIO
    } else {
      height = width / MAP_ASPECT_RATIO
    }

    width = Math.min(width, MAP_WIDTH)
    height = Math.min(height, MAP_HEIGHT)

    return {
      x: this.clamp(centerX - width / 2, 0, MAP_WIDTH - width),
      y: this.clamp(centerY - height / 2, 0, MAP_HEIGHT - height),
      width,
      height,
    }
  }

  private estimateLabelBounds(point: RegionMapPoint): LabelBounds {
    const scale = this.markerScale()
    const isPriority = this.isPreviewRegion(point.region) || this.isSelectedRegion(point.region)
    const fontSize = (isPriority ? 11 : 9) * scale
    const width = Math.max(24 * scale, point.region.displayName.length * fontSize * 0.58)
    const height = fontSize * 1.25
    const labelX = point.x + point.labelX * scale
    const baselineY = point.y + point.labelY * scale
    let left = labelX - width / 2

    if (point.labelAnchor === 'start') left = labelX
    if (point.labelAnchor === 'end') left = labelX - width

    return {
      left: left - 3 * scale,
      right: left + width + 3 * scale,
      top: baselineY - height - 2 * scale,
      bottom: baselineY + 2 * scale,
    }
  }

  private boundsOverlap(left: LabelBounds, right: LabelBounds): boolean {
    return !(
      left.right < right.left ||
      left.left > right.right ||
      left.bottom < right.top ||
      left.top > right.bottom
    )
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }

  private focusMarker(regionId: string): void {
    queueMicrotask(() => {
      this.hostElement.nativeElement
        .querySelector<SVGGElement>(`[data-map-region-id="${regionId}"]`)
        ?.focus()
    })
  }
}
