import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'

import { ThemeService } from '../../services'
import { LucideIconComponent } from '../icons/lucide-icons.component'

@Component({
  selector: 'app-theme-toggle',
  imports: [LucideIconComponent],
  template: `
    <button
      type="button"
      class="inline-flex size-9 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text-body focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-base)]"
      [attr.aria-label]="ariaLabel()"
      [attr.title]="ariaLabel()"
      (click)="themeService.toggleTheme()"
    >
      @if (themeService.themeMode() === 'dark') {
        <app-lucide-icon name="sun" class="size-5" aria-hidden="true" />
      } @else {
        <app-lucide-icon name="moon" class="size-5" aria-hidden="true" />
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService)

  readonly ariaLabel = computed(() => {
    const nextTheme = this.themeService.themeMode() === 'dark' ? 'light' : 'dark'
    return `Switch to ${nextTheme} theme`
  })
}
