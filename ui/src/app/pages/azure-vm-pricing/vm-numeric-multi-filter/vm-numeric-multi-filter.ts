import { Component, computed, input, output, signal } from '@angular/core'

import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

export interface VmNumericFilterOption {
  readonly value: number
  readonly count: number
}

export interface VmNumericFilterRange {
  readonly minimum: number
  readonly maximum: number
}

export const VM_VCPU_QUICK_VALUES = [2, 4, 8] as const
export const VM_MEMORY_QUICK_VALUES = [4, 8, 16, 32] as const

export function matchesVmNumericFilter(
  value: number | null,
  selectedValues: ReadonlySet<number>,
  selectedRange: VmNumericFilterRange | null
): boolean {
  if (selectedRange) {
    return value !== null && value >= selectedRange.minimum && value <= selectedRange.maximum
  }
  return selectedValues.size === 0 || (value !== null && selectedValues.has(value))
}

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

@Component({
  selector: 'app-vm-numeric-multi-filter',
  imports: [LucideIconComponent],
  templateUrl: './vm-numeric-multi-filter.html',
  host: { class: 'block min-w-0' },
})
export class VmNumericMultiFilter {
  readonly controlId = input.required<string>()
  readonly label = input.required<string>()
  readonly allLabel = input.required<string>()
  readonly singularUnit = input.required<string>()
  readonly pluralUnit = input.required<string>()
  readonly options = input.required<readonly VmNumericFilterOption[]>()
  readonly quickValues = input.required<readonly number[]>()
  readonly selectedValues = input.required<ReadonlySet<number>>()
  readonly selectedRange = input<VmNumericFilterRange | null>(null)
  readonly selectedValuesChange = output<ReadonlySet<number>>()
  readonly selectedRangeChange = output<VmNumericFilterRange | null>()
  readonly rangeError = signal('')

  readonly hasSelection = computed(
    () => this.selectedValues().size > 0 || this.selectedRange() !== null
  )
  readonly quickOptions = computed(() => {
    const counts = new Map(this.options().map((option) => [option.value, option.count]))
    return this.quickValues().map((value) => ({ value, count: counts.get(value) ?? 0 }))
  })

  readonly summary = computed(() => {
    const range = this.selectedRange()
    if (range) {
      return `${NUMBER_FORMATTER.format(range.minimum)}-${NUMBER_FORMATTER.format(range.maximum)} ${this.pluralUnit()}`
    }
    const values = [...this.selectedValues()].sort((left, right) => left - right)
    if (values.length === 0) return this.allLabel()
    if (values.length <= 3) {
      const unit = values.length === 1 && values[0] === 1 ? this.singularUnit() : this.pluralUnit()
      return `${values.map((value) => NUMBER_FORMATTER.format(value)).join(', ')} ${unit}`
    }
    return `${NUMBER_FORMATTER.format(values.length)} selected`
  })

  isSelected(value: number): boolean {
    return this.selectedValues().has(value)
  }

  select(value: number): void {
    this.rangeError.set('')
    this.selectedRangeChange.emit(null)
    this.selectedValuesChange.emit(new Set([value]))
  }

  clear(): void {
    this.rangeError.set('')
    this.selectedValuesChange.emit(new Set<number>())
    this.selectedRangeChange.emit(null)
  }

  applyRange(
    minimumValue: string,
    maximumValue: string,
    minimumInput: HTMLInputElement,
    maximumInput: HTMLInputElement,
    details: HTMLDetailsElement,
    trigger: HTMLElement
  ): void {
    const minimum = Number(minimumValue)
    const maximum = Number(maximumValue)
    if (
      !minimumValue.trim() ||
      !maximumValue.trim() ||
      !Number.isFinite(minimum) ||
      !Number.isFinite(maximum) ||
      minimum <= 0 ||
      maximum <= 0
    ) {
      this.rangeError.set('Enter positive minimum and maximum values.')
      if (!minimumValue.trim() || !Number.isFinite(minimum) || minimum <= 0) minimumInput.focus()
      else maximumInput.focus()
      return
    }
    if (minimum > maximum) {
      this.rangeError.set('Minimum cannot be greater than maximum.')
      minimumInput.focus()
      return
    }

    this.rangeError.set('')
    this.selectedValuesChange.emit(new Set<number>())
    this.selectedRangeChange.emit({ minimum, maximum })
    details.open = false
    trigger.focus()
  }

  optionLabel(value: number): string {
    const unit = value === 1 ? this.singularUnit() : this.pluralUnit()
    return `${NUMBER_FORMATTER.format(value)} ${unit}`
  }

  formatCount(value: number): string {
    return NUMBER_FORMATTER.format(value)
  }
}
