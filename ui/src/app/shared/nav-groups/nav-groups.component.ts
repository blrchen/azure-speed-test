import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'

import { LucideIconComponent, LucideIconName } from '../icons/lucide-icons.component'

export interface NavItem {
  readonly label: string
  readonly icon: LucideIconName
  readonly routerLink: string
}

export interface NavGroup {
  readonly heading?: string
  readonly items: readonly NavItem[]
}

@Component({
  selector: 'app-nav-groups',
  imports: [RouterLink, RouterLinkActive, LucideIconComponent],
  templateUrl: './nav-groups.component.html',
  styleUrl: './nav-groups.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavGroupsComponent {
  readonly navGroups = input<readonly NavGroup[] | null>(null)
  readonly dismissOnNavigate = input(false)
  readonly navigate = output<void>()

  readonly groups = computed<readonly NavGroup[]>(() => this.navGroups() ?? [])

  navGroupTrackBy(_index: number, group: NavGroup): string {
    return group.heading ?? `group-${_index}`
  }

  navItemTrackBy(_index: number, item: NavItem): string {
    return item.routerLink
  }

  handleNavLinkClick(): void {
    if (this.dismissOnNavigate()) {
      this.navigate.emit()
    }
  }
}
