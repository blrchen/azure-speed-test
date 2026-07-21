export type AvailabilityZoneFilter = '' | 'supported' | 'unsupported'

interface RegionGroupEntry {
  readonly regionGroup: string
}

interface GeographyEntry {
  readonly displayName: string
  readonly geography: string
}

export interface RegionGroupOption {
  readonly value: string
  readonly label: string
  readonly count: number
}

export interface RegionGroupCatalog {
  readonly options: readonly RegionGroupOption[]
  readonly byValue: ReadonlyMap<string, RegionGroupOption>
  readonly normalizeInput: (value: string | undefined) => string
}

export interface GroupedGeography<T> {
  readonly name: string
  readonly regions: readonly T[]
}

export const REGION_DIRECTORY_COLLATOR = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
})

export function toQueryValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function createRegionGroupCatalog<T extends RegionGroupEntry>(
  regions: readonly T[],
  orderedLabels?: readonly string[]
): RegionGroupCatalog {
  const counts = new Map<string, number>()
  for (const region of regions) {
    counts.set(region.regionGroup, (counts.get(region.regionGroup) ?? 0) + 1)
  }

  const labels =
    orderedLabels ??
    [...counts.keys()].sort((left, right) => REGION_DIRECTORY_COLLATOR.compare(left, right))
  const options: RegionGroupOption[] = []
  for (const label of labels) {
    const count = counts.get(label) ?? 0
    if (count > 0) {
      options.push({ value: toQueryValue(label), label, count })
    }
  }

  const byValue = new Map(options.map((option) => [option.value, option] as const))
  return {
    options,
    byValue,
    normalizeInput: (value) => {
      const normalized = toQueryValue(value ?? '')
      return byValue.has(normalized) ? normalized : ''
    },
  }
}

export function groupRegionsByGeography<T extends GeographyEntry>(
  regions: readonly T[]
): readonly GroupedGeography<T>[] {
  const groupedRegions = new Map<string, T[]>()

  for (const region of regions) {
    const geographyRegions = groupedRegions.get(region.geography) ?? []
    geographyRegions.push(region)
    groupedRegions.set(region.geography, geographyRegions)
  }

  return Array.from(groupedRegions.entries())
    .sort(([left], [right]) => REGION_DIRECTORY_COLLATOR.compare(left, right))
    .map(([name, geographyRegions]) => ({
      name,
      regions: [...geographyRegions].sort((left, right) =>
        REGION_DIRECTORY_COLLATOR.compare(left.displayName, right.displayName)
      ),
    }))
}

export function countGeographies<T extends Pick<GeographyEntry, 'geography'>>(
  regions: readonly T[]
): number {
  return new Set(regions.map((region) => region.geography)).size
}

export function normalizeSearchInput(value: string | undefined): string {
  return (value ?? '').slice(0, 120)
}

export function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function normalizeZoneFilterInput(value: string | undefined): AvailabilityZoneFilter {
  return value === 'supported' || value === 'unsupported' ? value : ''
}

export function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
