import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core'

import { LucideIconComponent } from '../icons/lucide-icons.component'

@Component({
  selector: 'app-export-csv-button',
  imports: [LucideIconComponent],
  template: `
    <button
      type="button"
      class="btn btn-outline btn--sm group"
      [disabled]="!rows()?.length"
      [attr.aria-label]="accessibleLabel()"
      (click)="export()"
    >
      <app-lucide-icon
        name="download"
        class="size-4 transition-transform group-hover:scale-110"
        aria-hidden="true"
      />
      <span>{{ label() }}</span>
    </button>
  `,
})
export class ExportCsvButtonComponent {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly document = inject(DOCUMENT)

  /** CSV filename (without extension) */
  readonly filename = input.required<string>()

  /** Column headers */
  readonly headers = input.required<string[]>()

  /** Data rows (raw strings, will be escaped internally) */
  readonly rows = input.required<string[][] | null>()

  /** Button label */
  readonly label = input<string>('Export CSV')

  /** Aria label */
  readonly ariaLabel = input<string>('Export results to CSV')

  protected readonly accessibleLabel = computed((): string => {
    const label = this.label()
    const ariaLabel = this.ariaLabel().trim()
    if (!ariaLabel) return label

    return ariaLabel.toLowerCase().includes(label.toLowerCase())
      ? ariaLabel
      : `${label}. ${ariaLabel}`
  })

  export(): void {
    if (!this.isBrowser) return

    const rows = this.rows()
    if (!rows?.length) return

    const date = new Date().toISOString().split('T')[0]
    this.downloadCsv(`${this.filename()}-${date}.csv`, this.headers(), rows)
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  private formatCsvRow(row: string[]): string {
    return row.map((field) => this.escapeCsvField(field)).join(',')
  }

  private downloadCsv(filename: string, headers: string[], rows: string[][]): void {
    const csvContent = [headers, ...rows].map((row) => this.formatCsvRow(row)).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = this.document.createElement('a')
    link.href = url
    link.download = filename
    link.style.visibility = 'hidden'

    const body = this.document.body
    body.appendChild(link)
    link.click()
    body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
