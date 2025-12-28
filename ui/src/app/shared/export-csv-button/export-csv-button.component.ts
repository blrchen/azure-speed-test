import { isPlatformBrowser } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input, PLATFORM_ID } from '@angular/core'

import { LucideIconComponent } from '../icons/lucide-icons.component'

@Component({
  selector: 'app-export-csv-button',
  imports: [LucideIconComponent],
  template: `
    <button
      type="button"
      class="btn btn-outline btn--sm group"
      [disabled]="!rows()?.length"
      [attr.aria-label]="ariaLabel()"
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportCsvButtonComponent {
  private readonly platformId = inject(PLATFORM_ID)
  private readonly isBrowser = isPlatformBrowser(this.platformId)

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

  private downloadCsv(filename: string, headers: string[], rows: string[][]): void {
    const escapeRow = (row: string[]): string =>
      row.map((field) => this.escapeCsvField(field)).join(',')
    const csvContent = [escapeRow(headers), ...rows.map(escapeRow)].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
