import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { ErrorHandler, inject, PLATFORM_ID, Service } from '@angular/core'

import { ChunkLoadErrorPromptStore } from './chunk-load-error-prompt.store'

const CHUNK_LOAD_ERROR_PATTERNS = [
  /chunk-[\w.-]+\.js/i,
  /ChunkLoadError/i,
  /Loading chunk \d+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /Failed to load module script/i,
]

@Service({ autoProvided: false })
export class CustomErrorHandler implements ErrorHandler {
  private readonly document = inject(DOCUMENT)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly reloadPrompt = inject(ChunkLoadErrorPromptStore)

  private get isOnline(): boolean {
    if (!this.isBrowser) return false
    return this.document.defaultView?.navigator.onLine ?? true
  }

  handleError(error: unknown): void {
    const originalError = this.unwrapError(error)

    if (this.isChunkLoadError(originalError) && this.isOnline) {
      this.reloadPrompt.show()
    }

    console.error(error)
  }

  private isChunkLoadError(error: unknown): boolean {
    // Match against the stack too: hashed chunk filenames only ever appear there.
    const errorText = this.getErrorText(error)
    return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(errorText))
  }

  private getErrorText(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}\n${error.message}\n${error.stack ?? ''}`
    }

    if (typeof error === 'string') {
      return error
    }

    if (this.isRecord(error)) {
      const message = typeof error['message'] === 'string' ? error['message'] : ''
      const stack = typeof error['stack'] === 'string' ? error['stack'] : ''
      return `${message}\n${stack}`.trim() || this.stringifyError(error)
    }

    return String(error)
  }

  private stringifyError(error: unknown): string {
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }

  private unwrapError(error: unknown): unknown {
    if (!this.isRecord(error)) return error

    const nestedError =
      error['ngOriginalError'] ?? error['rejection'] ?? error['reason'] ?? error['error']
    return nestedError === undefined || nestedError === error ? error : nestedError
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }
}
