import { provideHttpClient, withFetch } from '@angular/common/http'
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core'
import { provideClientHydration, withEventReplay } from '@angular/platform-browser'
import {
  createUrlTreeFromSnapshot,
  isActive,
  provideRouter,
  Router,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router'

import { routes } from './app.routes'
import { CustomErrorHandler } from './services/errors-handling/error-handler'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: CustomErrorHandler },
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withViewTransitions({
        onViewTransitionCreated: ({ transition, to }) => {
          const router = inject(Router)
          const toTree = createUrlTreeFromSnapshot(to, [])
          if (
            isActive(toTree, router, {
              paths: 'exact',
              matrixParams: 'exact',
              fragment: 'ignored',
              queryParams: 'ignored',
            })()
          ) {
            transition.skipTransition()
          }
        },
      })
    ),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
  ],
}
