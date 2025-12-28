import { ChangeDetectionStrategy, Component, effect, input, OnDestroy } from '@angular/core'

import { LucideIconComponent, LucideIconName } from '../icons/lucide-icons.component'
import { createCopyToClipboard } from '../utils'

@Component({
  selector: 'app-copy-button',
  imports: [LucideIconComponent],
  template: `
    <button
      type="button"
      class="btn btn-outline btn--sm group"
      [class.border-success]="isCopySuccess()"
      [class.bg-success/10]="isCopySuccess()"
      [class.text-success]="isCopySuccess()"
      [class.border-danger]="isCopyError()"
      [class.text-danger]="isCopyError()"
      [disabled]="!text()"
      [attr.aria-label]="ariaLabel()"
      aria-live="polite"
      (click)="copy()"
    >
      @if (isCopyIdle()) {
        <app-lucide-icon
          [name]="icon()"
          class="size-4 transition-transform group-hover:scale-110"
          aria-hidden="true"
        />
        <span>{{ label() }}</span>
      }
      @if (isCopySuccess()) {
        <app-lucide-icon name="check" class="size-4" aria-hidden="true" />
        <span>{{ successLabel() }}</span>
      }
      @if (isCopyError()) {
        <app-lucide-icon name="x" class="size-4" aria-hidden="true" />
        <span>Failed</span>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CopyButtonComponent implements OnDestroy {
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

  private readonly clipboard = createCopyToClipboard()
  readonly isCopyIdle = this.clipboard.isCopyIdle
  readonly isCopySuccess = this.clipboard.isCopySuccess
  readonly isCopyError = this.clipboard.isCopyError

  constructor() {
    // Reset status when resetOn changes
    effect(() => {
      this.resetOn() // track the signal
      this.clipboard.setStatus('idle')
    })
  }

  ngOnDestroy(): void {
    this.clipboard.destroy()
  }

  async copy(): Promise<void> {
    const value = this.text()
    if (value) {
      await this.clipboard.copyText(value)
    }
  }
}
