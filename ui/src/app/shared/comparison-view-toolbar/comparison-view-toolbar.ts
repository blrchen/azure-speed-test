import { DOCUMENT } from '@angular/common'
import { Component, computed, inject, input, output, signal } from '@angular/core'

import { LucideIconComponent } from '../icons/lucide-icons.component'

type CopyState = 'copied' | 'failed' | 'idle'

@Component({
  selector: 'app-comparison-view-toolbar',
  imports: [LucideIconComponent],
  templateUrl: './comparison-view-toolbar.html',
  host: { class: 'block min-w-0' },
})
export class ComparisonViewToolbar {
  private readonly document = inject(DOCUMENT)

  readonly totalRows = input.required<number>()
  readonly differingRows = input.required<number>()
  readonly uniformlyUnavailableRows = input(0)
  readonly showDifferencesOnly = input.required<boolean>()
  readonly showDifferencesOnlyChange = output<boolean>()
  readonly copyState = signal<CopyState>('idle')

  readonly matchingRows = computed(() => Math.max(0, this.totalRows() - this.differingRows()))
  readonly viewStatus = computed(() => {
    const differingRows = this.differingRows()
    const matchingRows = this.matchingRows()
    const uniformlyUnavailableRows = this.uniformlyUnavailableRows()
    const unavailableStatus = uniformlyUnavailableRows
      ? ` ${uniformlyUnavailableRows} matching price row${uniformlyUnavailableRows === 1 ? ' is' : 's are'} N/A for every selection.`
      : ''
    if (!this.showDifferencesOnly()) {
      return `${differingRows} differing row${differingRows === 1 ? '' : 's'} and ${matchingRows} matching row${matchingRows === 1 ? '' : 's'}.${unavailableStatus}`
    }
    if (differingRows === 0) {
      return `No differences in the current comparison.${unavailableStatus}`
    }
    return `Showing ${differingRows} differing row${differingRows === 1 ? '' : 's'}; ${matchingRows} matching row${matchingRows === 1 ? '' : 's'} hidden.${unavailableStatus}`
  })
  readonly copyButtonLabel = computed(() => {
    switch (this.copyState()) {
      case 'copied':
        return 'Link copied'
      case 'failed':
        return 'Copy unavailable'
      default:
        return 'Copy link'
    }
  })

  selectView(showDifferencesOnly: boolean): void {
    if (showDifferencesOnly !== this.showDifferencesOnly()) {
      this.showDifferencesOnlyChange.emit(showDifferencesOnly)
    }
  }

  async copyLink(): Promise<void> {
    const window = this.document.defaultView
    if (!window?.navigator.clipboard) {
      this.copyState.set('failed')
      return
    }
    try {
      await window.navigator.clipboard.writeText(window.location.href)
      this.copyState.set('copied')
    } catch {
      this.copyState.set('failed')
    }
  }
}
