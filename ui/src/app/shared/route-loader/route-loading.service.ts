import { DestroyRef, inject, Service, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router'
import { filter, finalize, switchMap, take } from 'rxjs'

const ROUTE_LOADER_DELAY_MS = 80

@Service()
export class RouteLoadingService {
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)
  private readonly loading = signal(false)
  private readonly hasCompletedInitialNavigation = signal(this.router.navigated)

  readonly isLoading = this.loading.asReadonly()

  constructor() {
    this.watchNavigationStarts()
    this.watchInitialNavigation()
  }

  private watchNavigationStarts(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        filter(() => this.hasCompletedInitialNavigation()),
        switchMap(() => {
          const timeoutId = this.scheduleLoader()
          return this.router.events.pipe(
            filter(isNavigationTerminalEvent),
            take(1),
            finalize(() => clearTimeout(timeoutId))
          )
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.loading.set(false)
      })
  }

  private watchInitialNavigation(): void {
    if (this.hasCompletedInitialNavigation()) return

    this.router.events
      .pipe(filter(isNavigationTerminalEvent), take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.hasCompletedInitialNavigation.set(true))
  }

  private scheduleLoader(): ReturnType<typeof setTimeout> {
    return setTimeout(() => this.loading.set(true), ROUTE_LOADER_DELAY_MS)
  }
}

function isNavigationTerminalEvent(
  event: unknown
): event is NavigationEnd | NavigationCancel | NavigationSkipped | NavigationError {
  return (
    event instanceof NavigationEnd ||
    event instanceof NavigationCancel ||
    event instanceof NavigationSkipped ||
    event instanceof NavigationError
  )
}
