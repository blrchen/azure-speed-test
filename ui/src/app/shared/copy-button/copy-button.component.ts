import { Component, computed, DestroyRef, inject, input, linkedSignal } from '@angular/core'

import { LucideIconComponent, LucideIconName } from '../icons/lucide-icons.component'
import { createCopyToClipboard, type CopyStatus } from '../utils'

@Component({
  selector: 'app-copy-button',
  imports: [LucideIconComponent],
  template: `
    <button
      type="button"
      class="btn btn-outline btn--sm group"
      [class]="statusClasses()"
      [disabled]="!text()"
      [attr.aria-label]="accessibleLabel()"
      aria-live="polite"
      aria-atomic="true"
      (click)="copy()"
    >
      @switch (copyStatus()) {
        @case ('idle') {
          <app-lucide-icon
            [name]="icon()"
            class="size-4 transition-transform group-hover:scale-110"
            aria-hidden="true"
          />
          <span>{{ label() }}</span>
        }
        @case ('copied') {
          <app-lucide-icon name="check" class="size-4" aria-hidden="true" />
          <span>{{ successLabel() }}</span>
        }
        @case ('failed') {
          <app-lucide-icon name="x" class="size-4" aria-hidden="true" />
          <span>Try Again</span>
        }
      }
    </button>
  `,
})
export class CopyButtonComponent {
  /** Text to copy to clipboard */
  readonly text = input<string>('')

  /** Icon name for idle state */
  readonly icon = input<LucideIconName>('copy')

  /** Label for idle state */
  readonly label = input<string>('Copy')

  /** Label for success state */
  readonly successLabel = input<string>('Copied!')

  /** Aria label (defaults to label value) */
  readonly ariaLabel = input<string>('')

  /** When this value changes, reset to idle state */
  readonly resetOn = input<unknown>(undefined)

  readonly copyStatus = linkedSignal<CopyStatus>(() => {
    this.resetOn()
    return 'idle'
  })
  private readonly clipboard = createCopyToClipboard({ copyStatus: this.copyStatus })

  protected readonly statusClasses = computed((): string => {
    const status = this.copyStatus()
    if (status === 'copied') {
      return 'border-success-dark bg-success/10 text-success-foreground dark:border-success dark:text-success'
    }
    if (status === 'failed') {
      return 'border-danger-dark text-danger-dark dark:border-danger dark:text-danger'
    }
    return ''
  })

  protected readonly accessibleLabel = computed((): string => {
    const status = this.copyStatus()
    if (status === 'copied') return this.successLabel()
    if (status === 'failed') return 'Copy failed. Try again'

    const label = this.label()
    const ariaLabel = this.ariaLabel().trim()
    if (!ariaLabel) return label

    return ariaLabel.toLowerCase().includes(label.toLowerCase())
      ? ariaLabel
      : `${label}. ${ariaLabel}`
  })

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clipboard.destroy())
  }

  async copy(): Promise<void> {
    await this.clipboard.copyText(this.text())
  }
}
