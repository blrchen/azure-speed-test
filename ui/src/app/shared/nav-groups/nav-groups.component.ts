import { Component, computed, inject, input, Signal } from '@angular/core'
import { isActive, IsActiveMatchOptions, Router } from '@angular/router'

import { LucideIconComponent, LucideIconName } from '../icons/lucide-icons.component'

const NAV_EXACT_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'ignored',
  matrixParams: 'ignored',
  fragment: 'ignored',
}

export const NAV_SUBSET_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'subset',
  queryParams: 'ignored',
  matrixParams: 'ignored',
  fragment: 'ignored',
}

export interface NavItem {
  readonly label: string
  readonly icon: LucideIconName
  readonly href: string
  readonly activeMatchOptions?: IsActiveMatchOptions
}

export interface NavGroup {
  readonly id: string
  readonly heading?: string
  readonly items: readonly NavItem[]
}

interface ResolvedNavItem extends NavItem {
  readonly isActive: Signal<boolean>
}

interface ResolvedNavGroup extends NavGroup {
  readonly items: readonly ResolvedNavItem[]
}

@Component({
  selector: 'app-nav-groups',
  imports: [LucideIconComponent],
  templateUrl: './nav-groups.component.html',
  host: { class: 'block' },
})
export class NavGroupsComponent {
  private readonly router = inject(Router)

  readonly navGroups = input<readonly NavGroup[]>([])

  /**
   * `isActive()` parses the href eagerly and returns a signal derived from router state, so
   * the active styling keeps updating under zoneless change detection. Cache one signal per
   * href instead of building them inside `resolvedNavGroups`: creating signals in a computed
   * would re-parse every href each time the `navGroups` input changes identity.
   */
  private readonly isActiveByHref = new Map<string, Signal<boolean>>()

  private resolveIsActive(item: NavItem): Signal<boolean> {
    let itemIsActive = this.isActiveByHref.get(item.href)
    if (!itemIsActive) {
      itemIsActive = isActive(
        item.href,
        this.router,
        item.activeMatchOptions ?? NAV_EXACT_MATCH_OPTIONS
      )
      this.isActiveByHref.set(item.href, itemIsActive)
    }

    return itemIsActive
  }

  protected readonly resolvedNavGroups = computed<readonly ResolvedNavGroup[]>(() =>
    this.navGroups().map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        isActive: this.resolveIsActive(item),
      })),
    }))
  )

  protected readonly activeLinkClasses =
    'bg-primary font-medium text-primary-foreground hover:bg-primary/90 active:bg-primary/90'
  protected readonly inactiveLinkClasses =
    'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground'
}
