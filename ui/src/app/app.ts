import { DOCUMENT } from '@angular/common'
import { Component, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import {
  NavigationEnd,
  NavigationSkipped,
  Router,
  RouterOutlet,
  type ActivatedRouteSnapshot,
} from '@angular/router'
import { filter } from 'rxjs'

import {
  APP_BRAND_LABEL,
  APP_GITHUB_ARIA_LABEL,
  APP_GITHUB_URL,
  APP_HOME_LINK,
  APP_NAV_GROUPS,
} from './app.navigation'
import { ChunkLoadErrorPromptComponent } from './services/errors-handling/chunk-load-error-prompt.component'
import { FooterComponent } from './shared/footer/footer.component'
import { LucideIconComponent } from './shared/icons/lucide-icons.component'
import {
  MobileNavComponent,
  type MobileNavCloseEvent,
} from './shared/mobile-nav/mobile-nav.component'
import { NavGroupsComponent } from './shared/nav-groups/nav-groups.component'
import { RouteLoaderComponent } from './shared/route-loader/route-loader.component'
import { RouteLoadingService } from './shared/route-loader/route-loading.service'
import { ThemeToggleComponent } from './shared/theme/theme-toggle.component'

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ChunkLoadErrorPromptComponent,
    FooterComponent,
    NavGroupsComponent,
    LucideIconComponent,
    MobileNavComponent,
    RouteLoaderComponent,
    ThemeToggleComponent,
  ],
  host: {
    class: 'block',
  },
  templateUrl: './app.html',
})
export class App {
  private readonly document = inject(DOCUMENT)
  private readonly router = inject(Router)
  private mobileNavTrigger: HTMLElement | null = null

  readonly mobileNavOpen = signal(false)
  readonly fullWidthShell = signal(false)
  readonly routeLoading = inject(RouteLoadingService)

  readonly brandLabel = APP_BRAND_LABEL
  readonly homeLink = APP_HOME_LINK
  readonly githubUrl = APP_GITHUB_URL
  readonly githubAriaLabel = APP_GITHUB_ARIA_LABEL
  readonly navGroups = APP_NAV_GROUPS

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd || event instanceof NavigationSkipped),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.updateShellLayout()
        this.closeMobileNav({ restoreFocus: false })
      })

    this.updateShellLayout()
  }

  toggleMobileNav(event?: Event): void {
    const willOpen = !this.mobileNavOpen()
    if (willOpen) {
      if (event?.currentTarget instanceof HTMLElement) {
        this.mobileNavTrigger = event.currentTarget
      }
      this.mobileNavOpen.set(true)
    } else {
      this.closeMobileNav()
    }
  }

  closeMobileNav(event: MobileNavCloseEvent = { restoreFocus: true }): void {
    const trigger = this.mobileNavTrigger
    this.mobileNavOpen.set(false)
    this.mobileNavTrigger = null
    if (event.restoreFocus) trigger?.focus()
  }

  focusMainContent(): void {
    const mainContent = this.document.getElementById('main-content')
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus()
      return
    }

    this.document.querySelector<HTMLHeadingElement>('h1')?.focus()
  }

  private updateShellLayout(): void {
    let useFullWidthShell = false

    for (
      let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
      route;
      route = route.firstChild
    ) {
      if (route.data['shellWidth'] === 'full') {
        useFullWidthShell = true
        break
      }
    }

    this.fullWidthShell.set(useFullWidthShell)
  }
}
