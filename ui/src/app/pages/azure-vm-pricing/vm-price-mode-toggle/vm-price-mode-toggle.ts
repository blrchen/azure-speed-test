import { Component, input, output } from '@angular/core'

import { VM_PRICE_MODE_OPTIONS, VmPriceMode } from '../../../services/vm-catalog'

@Component({
  selector: 'app-vm-price-mode-toggle',
  template: `
    <div
      class="inline-flex flex-wrap rounded-lg border border-border-soft bg-surface-muted p-1"
      role="group"
      [attr.aria-label]="label()"
    >
      @for (option of options; track option.value) {
        <button
          type="button"
          class="min-h-11 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden md:min-h-9 md:py-1.5"
          [class.bg-primary]="selected() === option.value"
          [class.text-primary-foreground]="selected() === option.value"
          [class.shadow-sm]="selected() === option.value"
          [class.text-text-body]="selected() !== option.value"
          [attr.aria-pressed]="selected() === option.value"
          [attr.aria-label]="option.shortLabel + '. ' + option.label + '. ' + option.description"
          [attr.title]="option.description"
          (click)="select(option.value)"
        >
          {{ option.shortLabel }}
        </button>
      }
    </div>
  `,
  host: { class: 'inline-flex max-w-full' },
})
export class VmPriceModeToggle {
  readonly selected = input.required<VmPriceMode>()
  readonly label = input('Pricing model')
  readonly selectedChange = output<VmPriceMode>()
  readonly options = VM_PRICE_MODE_OPTIONS

  select(priceMode: VmPriceMode): void {
    if (priceMode !== this.selected()) this.selectedChange.emit(priceMode)
  }
}
