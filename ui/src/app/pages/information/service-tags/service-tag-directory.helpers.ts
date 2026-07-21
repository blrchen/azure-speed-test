import {
  normalizeServiceTagCloud,
  ServiceTagCloud,
  ServiceTagRegionStatus,
  ServiceTagScope,
} from '../../../services/service-tags-snapshot'

export interface FilterOption<T extends string> {
  readonly value: T
  readonly label: string
}

export const SERVICE_TAG_STATUS_OPTIONS: readonly FilterOption<ServiceTagRegionStatus>[] = [
  { value: 'available', label: 'Generally available' },
  { value: 'restricted', label: 'Restricted access' },
  { value: 'planned', label: 'Planned' },
  { value: 'preview', label: 'Preview or special scope' },
  { value: 'unmapped', label: 'Unmapped scope' },
]

export const SERVICE_TAG_SCOPE_OPTIONS: readonly FilterOption<ServiceTagScope>[] = [
  { value: 'global', label: 'Global tags' },
  { value: 'regional', label: 'Regional tags' },
]

const REGION_STATUSES = new Set<ServiceTagRegionStatus>(
  SERVICE_TAG_STATUS_OPTIONS.map((option) => option.value)
)
const SERVICE_TAG_SCOPES = new Set<ServiceTagScope>(
  SERVICE_TAG_SCOPE_OPTIONS.map((option) => option.value)
)
const COUNT_FORMATTER = new Intl.NumberFormat('en-US')

export function normalizeDirectorySearch(value: string | undefined): string {
  return (value ?? '').slice(0, 120)
}

export function normalizeDirectoryCloud(value: string | undefined): ServiceTagCloud {
  return normalizeServiceTagCloud(value)
}

export function normalizeRegionStatus(value: string | undefined): ServiceTagRegionStatus | '' {
  if (value === 'all') return ''
  return REGION_STATUSES.has(value as ServiceTagRegionStatus)
    ? (value as ServiceTagRegionStatus)
    : 'available'
}

export function normalizeServiceTagScope(value: string | undefined): ServiceTagScope | '' {
  return SERVICE_TAG_SCOPES.has(value as ServiceTagScope) ? (value as ServiceTagScope) : ''
}

export function normalizeDirectoryGroup(value: string | undefined): string {
  return toQueryValue(value ?? '')
}

export function normalizeDirectoryLetter(value: string | undefined): string {
  const normalized = (value ?? '').trim().toUpperCase()
  return /^[A-Z]$/.test(normalized) ? normalized : ''
}

export function normalizeSelectedService(value: string | undefined): string {
  return (value ?? '').trim().slice(0, 160)
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function toQueryValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function toDomId(prefix: string, value: string): string {
  const suffix = toQueryValue(value)
  return suffix ? `${prefix}-${suffix}` : prefix
}

export function formatDirectoryCount(value: number): string {
  return COUNT_FORMATTER.format(value)
}

export function statusLabel(status: ServiceTagRegionStatus): string {
  return SERVICE_TAG_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
}
