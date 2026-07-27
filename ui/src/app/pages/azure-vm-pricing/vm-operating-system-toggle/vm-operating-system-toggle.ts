import { Component, input, output } from '@angular/core'

import { VM_OPERATING_SYSTEMS, VmOperatingSystem } from '../../../services/vm-catalog'

@Component({
  selector: 'app-vm-operating-system-toggle',
  template: `
    <div
      class="inline-flex rounded-lg border border-border-soft bg-surface-muted p-1"
      role="group"
      [attr.aria-label]="label()"
    >
      @for (operatingSystem of operatingSystems; track operatingSystem) {
        <button
          type="button"
          class="min-h-11 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden md:min-h-9 md:py-1.5"
          [class.bg-primary]="selected() === operatingSystem"
          [class.text-primary-foreground]="selected() === operatingSystem"
          [class.shadow-sm]="selected() === operatingSystem"
          [class.text-text-body]="selected() !== operatingSystem"
          [attr.aria-pressed]="selected() === operatingSystem"
          (click)="select(operatingSystem)"
        >
          {{ operatingSystem }}
        </button>
      }
    </div>
  `,
  host: { class: 'inline-flex' },
})
export class VmOperatingSystemToggle {
  readonly selected = input.required<VmOperatingSystem>()
  readonly label = input('Operating system')
  readonly selectedChange = output<VmOperatingSystem>()
  readonly operatingSystems = VM_OPERATING_SYSTEMS

  select(operatingSystem: VmOperatingSystem): void {
    if (operatingSystem !== this.selected()) this.selectedChange.emit(operatingSystem)
  }
}
