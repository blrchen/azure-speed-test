import { DOCUMENT } from '@angular/common'
import { inject, Service } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'

type StructuredData =
  Readonly<Record<string, unknown>> | readonly Readonly<Record<string, unknown>>[]

@Service()
export class SeoService {
  private readonly meta = inject(Meta)
  private readonly titleService = inject(Title)
  private readonly document = inject(DOCUMENT)

  setPageMeta({
    title,
    description,
    canonicalUrl,
    robots,
    structuredData,
  }: {
    title: string
    description: string
    canonicalUrl: string
    robots?: string
    structuredData?: StructuredData
  }): void {
    this.titleService.setTitle(title)
    this.meta.updateTag({ name: 'description', content: description })
    this.setRobots(robots ?? null)
    this.setCanonicalUrl(canonicalUrl)
    this.setStructuredData(structuredData ?? null)
  }

  private setCanonicalUrl(url: string): void {
    const head = this.document.head

    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = this.document.createElement('link')
      link.setAttribute('rel', 'canonical')
      head.appendChild(link)
    }
    link.setAttribute('href', url)
  }

  private setRobots(robots: string | null): void {
    if (!robots) {
      this.meta.removeTag('name="robots"')
      return
    }

    this.meta.updateTag({ name: 'robots', content: robots })
  }

  private setStructuredData(structuredData: StructuredData | null): void {
    const head = this.document.head
    let script = head.querySelector<HTMLScriptElement>('script[data-page-structured-data]')

    if (!structuredData) {
      script?.remove()
      return
    }

    if (!script) {
      script = this.document.createElement('script')
      script.setAttribute('type', 'application/ld+json')
      script.setAttribute('data-page-structured-data', '')
      head.appendChild(script)
    }

    script.textContent = JSON.stringify(structuredData)
  }
}
