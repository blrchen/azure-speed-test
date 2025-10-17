import { isPlatformBrowser } from '@angular/common'
import { inject, Injectable, PLATFORM_ID } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly meta = inject(Meta)
  private readonly titleService = inject(Title)
  private readonly platformId = inject(PLATFORM_ID)

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
    if (isPlatformBrowser(this.platformId)) {
      const existingLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

      if (existingLink) {
        existingLink.setAttribute('href', url)
        return
      }

      const link: HTMLLinkElement = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      link.setAttribute('href', url)
      document.head.appendChild(link)
    }
  }
}
