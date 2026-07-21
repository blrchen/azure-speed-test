import { Component, inject, input, output } from '@angular/core'
import { IsActiveMatchOptions, Router, RouterLink, RouterLinkActive } from '@angular/router'

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
  readonly routerLink: string
  readonly documentNavigation?: boolean
  readonly activeMatchOptions?: IsActiveMatchOptions
}

export interface NavGroup {
  readonly id: string
  readonly heading?: string
  readonly items: readonly NavItem[]
}

@Component({
  selector: 'app-nav-groups',
  imports: [RouterLink, RouterLinkActive, LucideIconComponent],
  templateUrl: './nav-groups.component.html',
  host: { class: 'block' },
})
export class NavGroupsComponent {
  private readonly router = inject(Router)

  readonly navGroups = input<readonly NavGroup[]>([])
  readonly dismissOnNavigate = input(false)
  readonly navigate = output<void>()

  protected readonly exactMatchOptions = NAV_EXACT_MATCH_OPTIONS
  protected readonly activeLinkClasses =
    'bg-primary font-medium text-primary-foreground hover:bg-primary/90 active:bg-primary/90'
  protected readonly inactiveLinkClasses =
    'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground'

  handleNavLinkClick(event: MouseEvent): void {
    if (this.dismissOnNavigate() && isPrimaryUnmodifiedClick(event)) {
      this.navigate.emit()
    }
  }

  isNavItemActive(item: NavItem): boolean {
    return this.router.isActive(item.routerLink, item.activeMatchOptions ?? this.exactMatchOptions)
  }
}

function isPrimaryUnmodifiedClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
}
