/**
 * Helpers shared by the download, upload, and large-file upload speed tests.
 *
 * Only behaviour that is identical across those pages lives here. Formatting
 * that differs on purpose stays local to each page: the large-file page scales
 * KiB/MiB/GiB for arbitrary user files rather than using the fixed-MiB
 * `formatMibDataSize`, `getStatusLabel` maps a different status union per page,
 * and the metric calculators produce page-specific result shapes.
 */

/** Bytes in one mebibyte, shared by the byte-size math on the test pages. */
export const BYTES_PER_MIB = 1024 * 1024

/** Narrows an unknown rejection value so status-like fields can be read. */
export function isErrorLike<T extends object>(error: unknown): error is T {
  return typeof error === 'object' && error !== null
}

/** True when the value represents a cancelled operation. */
export function isAbortError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'AbortError'
  }
  return isErrorLike<{ name?: string }>(error) && error.name === 'AbortError'
}

/** Throws an `AbortError` when the signal is already aborted. */
export function throwIfAborted(signal: AbortSignal, cancelMessage: string): void {
  if (signal.aborted) throw new DOMException(cancelMessage, 'AbortError')
}

export interface AbortAndTimeoutOptions {
  /** Message for the `AbortError` raised when the signal aborts. */
  readonly cancelMessage: string
  /** Error to reject with once `timeoutMs` elapses. */
  readonly createTimeoutError: () => Error
  /** Wraps a rejection that is not already an `Error`. */
  readonly wrapRejection: (error: unknown) => Error
}

/**
 * Rejects with `createTimeoutError()` after `timeoutMs`, or with an
 * `AbortError` carrying `cancelMessage` when the signal aborts first.
 * Rejections that are already an `Error` propagate untouched; anything else is
 * passed through `wrapRejection`, which each page defines differently.
 */
export function awaitWithAbortAndTimeout<T>(
  promise: Promise<T>,
  signal: AbortSignal,
  timeoutMs: number,
  options: AbortAndTimeoutOptions
): Promise<T> {
  const { cancelMessage, createTimeoutError, wrapRejection } = options
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException(cancelMessage, 'AbortError'))
      return
    }

    function finish(callback: () => void): void {
      clearTimeout(timeoutId)
      signal.removeEventListener('abort', onAbort)
      callback()
    }
    const timeoutId = setTimeout(() => finish(() => reject(createTimeoutError())), timeoutMs)
    const onAbort = () => finish(() => reject(new DOMException(cancelMessage, 'AbortError')))

    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) =>
        finish(() => reject(error instanceof Error ? error : wrapRejection(error)))
    )
  })
}

/** Formats an elapsed duration as `1.5 sec` or `2 min 5 sec`. */
export function formatTestDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} sec`
  return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} sec`
}

const TEST_TIME_FORMATTER = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Formats a completion timestamp for result tables and CSV exports. */
export function formatTestTime(timestamp: number): string {
  return TEST_TIME_FORMATTER.format(timestamp)
}

const MIB_SIZE_FORMATTER = new Intl.NumberFormat('en', { maximumFractionDigits: 1 })

/**
 * Formats a byte count as MiB for the fixed-size multi-region tests. The
 * large-file page keeps its own adaptive KiB/MiB/GiB formatter because it
 * reports arbitrary user file sizes.
 */
export function formatMibDataSize(bytes: number): string {
  return `${MIB_SIZE_FORMATTER.format(bytes / BYTES_PER_MIB)} MiB`
}
