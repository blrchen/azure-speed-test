import { Inject, Injectable, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { Meta, Title } from '@angular/platform-browser'

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private meta: Meta,
    private titleService: Title,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

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
      const link: HTMLLinkElement = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      link.setAttribute('href', url)
      document.head.appendChild(link)
    }
  }
}
