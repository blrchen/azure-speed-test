import { computed, signal } from '@angular/core'

export type CopyStatus = 'idle' | 'copied' | 'failed'

export const toRegionNameNoSpace = (displayName: string): string => displayName.replace(/\s+/g, '')

export const generateTimestampedBlobName = (): string => {
  const time = new Date(Date.now())
  return `${time.getFullYear()}${time.getMonth()}${time.getDate()}${time.getHours()}${time.getMinutes()}${time.getSeconds()}${time.getMilliseconds()}`
}

export const buildRegionDetailRouterLink = (
  displayName: string | null | undefined
): [string, string] => ['/Information/AzureRegions', toRegionNameNoSpace(displayName ?? '')]

export const createCopyToClipboard = (options?: { resetMs?: number }) => {
  const resetMs = options?.resetMs ?? 3000
  const copyStatus = signal<CopyStatus>('idle')
  const isCopyIdle = computed(() => copyStatus() === 'idle')
  const isCopySuccess = computed(() => copyStatus() === 'copied')
  const isCopyError = computed(() => copyStatus() === 'failed')

  let resetTimeoutId: ReturnType<typeof setTimeout> | null = null

  const clearReset = (): void => {
    if (resetTimeoutId !== null) {
      clearTimeout(resetTimeoutId)
      resetTimeoutId = null
    }
  }

  const setStatus = (status: CopyStatus): void => {
    copyStatus.set(status)
    clearReset()
    if (status === 'idle') {
      return
    }
    resetTimeoutId = setTimeout(() => {
      resetTimeoutId = null
      copyStatus.set('idle')
    }, resetMs)
  }

  const copyText = async (text: string | null | undefined): Promise<void> => {
    if (!text) {
      return
    }
    try {
      const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined
      if (!clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
      }
      await clipboard.writeText(text)
      setStatus('copied')
    } catch (error) {
      console.error('Failed to copy to clipboard', error)
      setStatus('failed')
    }
  }

  const destroy = (): void => {
    clearReset()
  }

  return {
    copyStatus,
    isCopyIdle,
    isCopySuccess,
    isCopyError,
    setStatus,
    copyText,
    destroy
  }
}
