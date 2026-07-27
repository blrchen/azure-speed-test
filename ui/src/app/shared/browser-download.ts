/**
 * Triggers a browser file download for an in-memory blob.
 *
 * Callers own the parts that differ between exports: platform guards, blob
 * content and MIME type, and the final filename (including any date suffix).
 */
export function downloadBlob(document: Document, filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.visibility = 'hidden'

  const body = document.body
  body.appendChild(link)
  link.click()
  body.removeChild(link)
  URL.revokeObjectURL(url)
}
