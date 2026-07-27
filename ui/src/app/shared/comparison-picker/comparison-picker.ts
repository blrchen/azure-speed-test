import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox'
import { Listbox, Option } from '@angular/aria/listbox'
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay'
import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core'

import { LucideIconComponent } from '../icons/lucide-icons.component'
import {
  buildSearchIndex,
  buildSearchQuery,
  matchesSearchIndex,
  normalizeSearch,
} from '../search-normalization'

const COMPARISON_PICKER_RESULT_LIMIT = 40
const COMPARISON_PICKER_OVERLAY_POSITIONS: ConnectedPosition[] = [
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 6,
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -6,
  },
]

export interface ComparisonPickerOption {
  readonly value: string
  readonly label: string
  readonly description: string
  readonly searchText: string
}

@Component({
  selector: 'app-comparison-picker',
  imports: [
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    Combobox,
    ComboboxPopup,
    ComboboxWidget,
    Listbox,
    Option,
    LucideIconComponent,
  ],
  templateUrl: './comparison-picker.html',
  styleUrl: './comparison-picker.css',
  host: { class: 'block min-w-0' },
})
export class ComparisonPicker {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef)

  readonly inputId = input.required<string>()
  readonly label = input.required<string>()
  readonly options = input.required<readonly ComparisonPickerOption[]>()
  readonly selectedValue = input.required<string | null>()
  readonly placeholder = input('Search...')
  readonly disabled = input(false)
  readonly codeStyle = input(false)
  readonly optionSelected = output<string>()

  readonly displayedOption = linkedSignal(
    () => this.options().find((option) => option.value === this.selectedValue()) ?? null
  )
  readonly query = linkedSignal(() => this.displayedOption()?.label ?? '')
  readonly selectedValues = linkedSignal(() => {
    const selectedOptionValue = this.displayedOption()?.value
    return selectedOptionValue ? [selectedOptionValue] : []
  })
  readonly expanded = signal(false)
  readonly overlayPositions = COMPARISON_PICKER_OVERLAY_POSITIONS

  private readonly indexedOptions = computed(() =>
    this.options().map((option) => ({
      option,
      searchIndex: buildSearchIndex(`${option.label} ${option.description} ${option.searchText}`),
    }))
  )

  readonly matchingOptions = computed(() => {
    const selectedOptionLabel = normalizeSearch(this.displayedOption()?.label ?? '')
    const normalizedQuery = normalizeSearch(this.query())
    if (!normalizedQuery || normalizedQuery === selectedOptionLabel) return this.options()

    const query = buildSearchQuery(this.query())
    return this.indexedOptions()
      .filter((indexedOption) => matchesSearchIndex(indexedOption.searchIndex, query))
      .map((indexedOption) => indexedOption.option)
  })
  readonly visibleOptions = computed(() =>
    this.matchingOptions().slice(0, COMPARISON_PICKER_RESULT_LIMIT)
  )
  readonly resultStatus = computed(() => {
    const matchingCount = this.matchingOptions().length
    if (matchingCount === 0) return 'No items match this search.'
    if (matchingCount > COMPARISON_PICKER_RESULT_LIMIT) {
      return `Showing ${COMPARISON_PICKER_RESULT_LIMIT} of ${matchingCount} items. Keep typing to narrow the list.`
    }
    return `${matchingCount} item${matchingCount === 1 ? '' : 's'} available.`
  })

  openPicker(): void {
    if (!this.disabled()) this.expanded.set(true)
  }

  updateQuery(query: string): void {
    this.query.set(query)
    this.openPicker()
  }

  updateExpanded(expanded: boolean): void {
    this.expanded.set(expanded)
    if (!expanded) this.restoreQuery()
  }

  closeFromOutside(event: MouseEvent): void {
    if (event.composedPath().includes(this.elementRef.nativeElement)) return
    this.updateExpanded(false)
  }

  selectOption(optionValues: readonly string[]): void {
    const optionValue = optionValues[0]
    const option = this.options().find((candidate) => candidate.value === optionValue)
    if (!option) {
      this.selectedValues.set(this.displayedOption() ? [this.displayedOption()!.value] : [])
      return
    }

    this.displayedOption.set(option)
    this.query.set(option.label)
    this.selectedValues.set([option.value])
    this.expanded.set(false)
    this.optionSelected.emit(option.value)
  }

  private restoreQuery(): void {
    this.query.set(this.displayedOption()?.label ?? '')
  }
}
