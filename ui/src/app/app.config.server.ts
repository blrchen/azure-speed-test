import { ApplicationConfig, mergeApplicationConfig } from '@angular/core'
import { provideServerRendering, withRoutes } from '@angular/ssr'

import { appConfig } from './app.config'
import { serverRoutes } from './app.routes.server'
import { SERVER_SERVICE_TAG_SUMMARY_SOURCE } from './services/service-tags-assets.server'
import { SERVICE_TAG_SUMMARY_SOURCE } from './services/service-tags-summary-source'

const VM_CATALOG_SSR_FETCH_LIMIT_BYTES = 8 * 1024 * 1024

const serverConfig: ApplicationConfig = {
  providers: [
    // The generated VM directory and larger Region shards exceed Angular's 1 MiB SSR default.
    // Keep a finite ceiling while allowing the catalog resolver to prerender those pages.
    provideServerRendering(
      { maxResponseBodySize: VM_CATALOG_SSR_FETCH_LIMIT_BYTES },
      withRoutes(serverRoutes)
    ),
    { provide: SERVICE_TAG_SUMMARY_SOURCE, useValue: SERVER_SERVICE_TAG_SUMMARY_SOURCE },
  ],
}

export const config = mergeApplicationConfig(appConfig, serverConfig)
