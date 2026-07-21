export type VmPriceSortDirection = 'asc' | 'desc'

export function nextVmPriceSortDirection(
  currentKey: string,
  currentDirection: VmPriceSortDirection,
  nextKey: string,
  defaultDirection: VmPriceSortDirection
): VmPriceSortDirection {
  if (currentKey !== nextKey) return defaultDirection
  return currentDirection === 'asc' ? 'desc' : 'asc'
}

export function vmPriceSortAriaValue(
  currentKey: string,
  currentDirection: VmPriceSortDirection,
  columnKey: string
): 'ascending' | 'descending' | null {
  if (currentKey !== columnKey) return null
  return currentDirection === 'asc' ? 'ascending' : 'descending'
}

export function compareVmPriceStrings(
  collator: Intl.Collator,
  left: string,
  right: string,
  direction: VmPriceSortDirection
): number {
  const comparison = collator.compare(left, right)
  return direction === 'asc' ? comparison : -comparison
}

export function compareVmPriceNumbers(
  left: number,
  right: number,
  direction: VmPriceSortDirection
): number {
  return direction === 'asc' ? left - right : right - left
}

export function compareNullableVmPriceNumbers(
  left: number | null,
  right: number | null,
  direction: VmPriceSortDirection
): number {
  if (left === null) return right === null ? 0 : 1
  if (right === null) return -1
  return compareVmPriceNumbers(left, right, direction)
}
