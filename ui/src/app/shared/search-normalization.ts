export function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface SearchIndex {
  readonly normalized: string
  readonly compact: string
}

export function buildSearchIndex(value: string): SearchIndex {
  const normalized = normalizeSearch(value)
  return {
    normalized,
    compact: normalized.replace(/\s+/g, ''),
  }
}

export function buildSearchQuery(value: string): readonly SearchIndex[] {
  return value
    .trim()
    .split(/\s+/)
    .map(buildSearchIndex)
    .filter((term) => Boolean(term.normalized))
}

export function matchesSearchIndex(
  searchIndex: SearchIndex,
  query: readonly SearchIndex[]
): boolean {
  return query.every(
    (term) =>
      searchIndex.normalized.includes(term.normalized) || searchIndex.compact.includes(term.compact)
  )
}

export function buildSearchPhrases(value: string): readonly string[] {
  return value.trim().split(/\s+/).map(normalizeSearch).filter(Boolean)
}

export function matchesSearchPhrases(searchableValue: string, phrases: readonly string[]): boolean {
  const normalizedValue = normalizeSearch(searchableValue)
  const compactValue = normalizedValue.replace(/\s+/g, '')

  return phrases.every((phrase) => {
    const normalizedPhrase = normalizeSearch(phrase)
    return (
      normalizedValue.includes(normalizedPhrase) ||
      compactValue.includes(normalizedPhrase.replace(/\s+/g, ''))
    )
  })
}
