const SITE_ORIGIN = 'https://www.azurespeed.com'
const SITE_NAME = 'Azure Speed Test'

const DATASET_CREATOR: StructuredDataNode = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_ORIGIN,
}

// Covers this site's compilation and normalization of the data, not the upstream Azure prices.
const DATASET_LICENSE = 'https://creativecommons.org/licenses/by/4.0/'

type StructuredDataNode = Readonly<Record<string, unknown>>

export interface BreadcrumbEntry {
  readonly name: string
  readonly path: string
}

interface FaqEntry {
  readonly question: string
  readonly answer: string
}

interface ItemListEntry {
  readonly name: string
  readonly path?: string
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildSchemaNode(
  type: string,
  properties: Readonly<Record<string, unknown>>
): StructuredDataNode {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    ...properties,
  }
}

export function buildDataset(properties: Readonly<Record<string, unknown>>): StructuredDataNode {
  return buildSchemaNode('Dataset', {
    creator: DATASET_CREATOR,
    license: DATASET_LICENSE,
    ...properties,
  })
}

export function buildBreadcrumbList(entries: readonly BreadcrumbEntry[]): StructuredDataNode {
  return buildSchemaNode('BreadcrumbList', {
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  })
}

export function buildFaqPage(entries: readonly FaqEntry[]): StructuredDataNode {
  return buildSchemaNode('FAQPage', {
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  })
}

export function buildListItems(entries: readonly ItemListEntry[]): readonly StructuredDataNode[] {
  return entries.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: entry.name,
    ...(entry.path ? { url: absoluteUrl(entry.path) } : {}),
  }))
}

export function buildItemList({
  name,
  numberOfItems,
  entries,
}: {
  readonly name: string
  readonly numberOfItems: number
  readonly entries: readonly ItemListEntry[]
}): StructuredDataNode {
  return buildSchemaNode('ItemList', {
    name,
    numberOfItems,
    itemListElement: buildListItems(entries),
  })
}
