import { DOCUMENT } from '@angular/common'
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core'
import { RouterLink } from '@angular/router'

import { LucideIconComponent } from '../icons/lucide-icons.component'
import { NavGroup, NavGroupsComponent } from '../nav-groups/nav-groups.component'

export interface MobileNavCloseEvent {
  readonly restoreFocus: boolean
}

@Component({
  selector: 'app-mobile-nav',
  imports: [RouterLink, NavGroupsComponent, LucideIconComponent],
  templateUrl: './mobile-nav.component.html',
  host: {
    '(document:keydown.escape)': 'requestClose()',
    '(document:keydown.tab)': 'handleTabKey($event)',
  },
})
export class MobileNavComponent {
  private readonly document = inject(DOCUMENT)
  private readonly destroyRef = inject(DestroyRef)
  private readonly mobileNavPanel = viewChild<ElementRef<HTMLElement>>('mobileNavPanel')
  private readonly mobileNavCloseBtn = viewChild<ElementRef<HTMLButtonElement>>('mobileNavCloseBtn')

  readonly brandLabel = input.required<string>()
  readonly homeLink = input.required<string>()
  readonly navGroups = input.required<readonly NavGroup[]>()
  readonly closed = output<MobileNavCloseEvent>()

  constructor() {
    afterNextRender({
      write: () => {
        this.lockBodyScroll()
        this.mobileNavCloseBtn()?.nativeElement.focus()
      },
    })
  }

  requestClose(): void {
    this.closed.emit({ restoreFocus: true })
  }

  handleTabKey(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return

    const panel = this.mobileNavPanel()?.nativeElement
    if (!panel) return

    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (focusableElements.length === 0) return

    const firstEl = focusableElements[0]
    const lastEl = focusableElements[focusableElements.length - 1]
    const activeElement = this.document.activeElement

    if (event.shiftKey && activeElement === firstEl) {
      event.preventDefault()
      lastEl.focus()
    } else if (!event.shiftKey && activeElement === lastEl) {
      event.preventDefault()
      firstEl.focus()
    }
  }

  private lockBodyScroll(): void {
    const body = this.document.body

    const previousOverflowY = body.style.overflowY
    body.style.overflowY = 'hidden'

    this.destroyRef.onDestroy(() => {
      if (previousOverflowY) {
        body.style.overflowY = previousOverflowY
      } else {
        body.style.removeProperty('overflow-y')
      }
    })
  }
}
