import { Component, inject, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services/seo.service'

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <article class="page-shell section-stack mx-auto max-w-5xl">
      <header class="page-header text-center">
        <h1 class="page-title">Page not found</h1>
        <p class="page-lead">The page you are looking for does not exist or has been moved.</p>
      </header>
      <section class="section-block text-center" aria-labelledby="actions-heading">
        <h2 id="actions-heading" class="sr-only">Actions</h2>
        <a routerLink="/Azure/Latency" class="link-primary font-medium">Return to homepage</a>
      </section>
    </article>
  `,
})
export class NotFoundComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Page Not Found - Azure Speed Test',
      description: 'The requested Azure Speed Test page does not exist or has been moved.',
      canonicalUrl: 'https://www.azurespeed.com/not-found',
      robots: 'noindex, follow',
    })
  }
}
