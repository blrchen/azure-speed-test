import { Component, input, output } from '@angular/core'

export type VmPriceDisplay = 'hourly' | 'monthly'

export const VM_PRICE_DISPLAYS: readonly VmPriceDisplay[] = ['hourly', 'monthly']

const DISPLAY_LABELS: Record<VmPriceDisplay, string> = {
  hourly: 'Hourly',
  monthly: 'Monthly',
}

@Component({
  selector: 'app-vm-price-display-toggle',
  template: `
    <div
      class="inline-flex rounded-lg border border-border-soft bg-surface-muted p-1"
      role="group"
      aria-label="Price display"
    >
      @for (display of displays; track display) {
        <button
          type="button"
          class="min-h-11 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none md:min-h-9 md:py-1.5"
          [class.bg-primary]="selected() === display"
          [class.text-primary-foreground]="selected() === display"
          [class.shadow-sm]="selected() === display"
          [class.text-text-body]="selected() !== display"
          [attr.aria-pressed]="selected() === display"
          (click)="select(display)"
        >
          {{ labels[display] }}
        </button>
      }
    </div>
  `,
  host: { class: 'inline-flex' },
})
export class VmPriceDisplayToggle {
  readonly selected = input.required<VmPriceDisplay>()
  readonly selectedChange = output<VmPriceDisplay>()
  readonly displays = VM_PRICE_DISPLAYS
  readonly labels = DISPLAY_LABELS

  select(display: VmPriceDisplay): void {
    if (display !== this.selected()) this.selectedChange.emit(display)
  }
}
