type DocumentQueryParam =
  string | number | boolean | readonly (string | number | boolean)[] | null | undefined

export function buildDocumentHref(
  path: string,
  queryParams?: Readonly<Record<string, DocumentQueryParam>> | null,
  fragment?: string
): string {
  const searchParams = new URLSearchParams()

  for (const [name, value] of Object.entries(queryParams ?? {})) {
    if (value === null || value === undefined) continue

    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      searchParams.append(name, String(item))
    }
  }

  const query = searchParams.toString()
  const hash = fragment ? `#${encodeURIComponent(fragment)}` : ''
  return `${path}${query ? `?${query}` : ''}${hash}`
}
