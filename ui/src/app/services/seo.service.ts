import { DOCUMENT, inject, Injectable } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly meta = inject(Meta)
  private readonly titleService = inject(Title)
  private readonly document = inject(DOCUMENT)

  public setMetaTitle(title: string): void {
    this.titleService.setTitle(title)
  }

  public setMetaDescription(content: string): void {
    this.meta.updateTag({
      name: 'description',
      content: content
    })
  }

  public setCanonicalUrl(url: string): void {
    const head = this.document?.head
    if (!head) {
      return
    }

    const existingLink = head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

    if (existingLink) {
      existingLink.setAttribute('href', url)
      return
    }

    const link: HTMLLinkElement = this.document.createElement('link')
    link.setAttribute('rel', 'canonical')
    link.setAttribute('href', url)
    head.appendChild(link)
  }
}
