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
    const isChunkLoadError = this.isChunkLoadError(originalError)

    if (isChunkLoadError && this.isOnline) {
      this.reloadPrompt.show()
    }

    console.error(error)
  }

  private isChunkLoadError(error: unknown): boolean {
    const errorMessage = this.getErrorMessage(error)
    return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(errorMessage))
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return this.getFirstLine(`${error.name}: ${error.message}`)
    }

    if (typeof error === 'string') {
      return this.getFirstLine(error)
    }

    if (this.isRecord(error)) {
      const name = typeof error['name'] === 'string' ? error['name'] : ''
      const message = typeof error['message'] === 'string' ? error['message'] : ''
      return this.getFirstLine(name && message ? `${name}: ${message}` : name || message)
    }

    return this.getFirstLine(String(error))
  }

  private getFirstLine(value: string): string {
    return value.split('\n', 1)[0]?.trim() ?? ''
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
