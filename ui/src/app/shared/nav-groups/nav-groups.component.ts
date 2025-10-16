import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { HeroIconComponent, HeroIconName } from '../icons/hero-icons.imports'

export interface NavItem {
  readonly label: string
  readonly icon: HeroIconName
  readonly routerLink: string
}

export interface NavGroup {
  readonly heading?: string
  readonly items: readonly NavItem[]
}

@Component({
  selector: 'app-nav-groups',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HeroIconComponent],
  templateUrl: './nav-groups.component.html',
  styleUrl: './nav-groups.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavGroupsComponent {
  readonly navGroups = input<readonly NavGroup[] | null>(null)
  readonly dismissOnNavigate = input(false)
  readonly navigate = output<void>()

  readonly groups = computed<readonly NavGroup[]>(() => this.navGroups() ?? [])

  readonly navGroupTrackBy = (_index: number, group: NavGroup): string =>
    group.heading ?? `group-${_index}`

  readonly navItemTrackBy = (_index: number, item: NavItem): string => item.routerLink

  handleNavLinkClick(): void {
    if (this.dismissOnNavigate()) {
      this.navigate.emit()
    }
  }
}
