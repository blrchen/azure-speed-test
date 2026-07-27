import { HttpClient } from '@angular/common/http'
import { signal, type Signal, type WritableSignal } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import { API_ENDPOINT } from './constants'

export function toRegionNameNoSpace(displayName: string): string {
  return displayName.replace(/\s+/g, '')
}

export function parseRegionParam(raw: string | null | undefined): string[] {
  if (!raw) return []
  const tokens = raw
    .replace(/[|;]/g, ',')
    .split(',')
    .map((part) => normalizeUrlToken(part))
    .filter(Boolean)
  return [...new Set(tokens)]
}

export function buildRegionSelectionSignature(regionIds: readonly string[]): string {
  return regionIds
    .map((id) => normalizeUrlToken(id))
    .sort()
    .join(',')
}

export function getSortedRegionIds(regionIds: readonly string[]): string[] {
  return [...regionIds].sort((a, b) => a.localeCompare(b))
}

export function buildNormalizedRegionLookup<TRegion extends { regionId: string }>(
  regions: readonly TRegion[]
): Map<string, TRegion> {
  const lookup = new Map<string, TRegion>()
  for (const region of regions) {
    const key = normalizeUrlToken(region.regionId)
    if (key && !lookup.has(key)) lookup.set(key, region)
  }
  return lookup
}

/**
 * Maps normalized URL tokens back to regions using a lookup built by
 * `buildNormalizedRegionLookup`. Results keep the incoming token order,
 * unknown tokens are dropped, and duplicates are removed by real `regionId`
 * so aliases that normalize to the same region only appear once.
 */
export function resolveRegionsFromNormalizedTokens<TRegion extends { regionId: string }>(
  normalizedTokens: readonly string[],
  lookup: ReadonlyMap<string, TRegion>
): TRegion[] {
  const seen = new Set<string>()
  return normalizedTokens
    .map((token) => lookup.get(token))
    .filter((match): match is TRegion => {
      if (!match || seen.has(match.regionId)) return false
      seen.add(match.regionId)
      return true
    })
}

export function generateTimestampedBlobName(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, '')
}

export function buildRegionDetailHref(
  displayName: string | null | undefined,
  source?: string | null
): string {
  const path = `/Information/AzureRegions/${toRegionNameNoSpace(displayName ?? '')}`
  return source ? `${path}?source=${encodeURIComponent(source)}` : path
}

export function buildRegionLatencyHref(sourceRegion: string | null | undefined): string {
  const normalizedSource = toRegionNameNoSpace(sourceRegion ?? '')
  return normalizedSource
    ? `/Azure/RegionToRegionLatency/${normalizedSource}`
    : '/Azure/RegionToRegionLatency'
}

export type CopyStatus = 'idle' | 'copied' | 'failed'

interface CopyClipboardController {
  copyStatus: Signal<CopyStatus>
  setStatus: (status: CopyStatus) => void
  copyText: (text: string | null | undefined) => Promise<void>
  destroy: () => void
}

export function createCopyToClipboard(options?: {
  resetMs?: number
  copyStatus?: WritableSignal<CopyStatus>
}): CopyClipboardController {
  const resetMs = options?.resetMs ?? 3000
  const copyStatus = options?.copyStatus ?? signal<CopyStatus>('idle')

  let resetTimeoutId: ReturnType<typeof setTimeout> | null = null

  function clearReset(): void {
    if (resetTimeoutId !== null) {
      clearTimeout(resetTimeoutId)
      resetTimeoutId = null
    }
  }

  function setStatus(status: CopyStatus): void {
    copyStatus.set(status)
    clearReset()
    if (status === 'idle') return
    resetTimeoutId = setTimeout(() => {
      resetTimeoutId = null
      copyStatus.set('idle')
    }, resetMs)
  }

  async function copyText(text: string | null | undefined): Promise<void> {
    if (!text) return
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

  function destroy(): void {
    clearReset()
  }

  return { copyStatus, setStatus, copyText, destroy }
}

export async function getSasUrl(
  http: HttpClient,
  regionName: string,
  blobName: string,
  operation = 'upload'
): Promise<string> {
  const url = `${API_ENDPOINT}/api/sas`
  const params = { regionName, blobName, operation }
  const response = await firstValueFrom(http.get<{ url: string }>(url, { params }))
  return response.url
}

export const REGION_NAME_COLLATOR = new Intl.Collator('en', { sensitivity: 'base' })

export type LatencyTone = 'fast' | 'moderate' | 'slow' | 'unknown'

export function normalizeUrlToken(value: string | null | undefined): string {
  if (value == null) return ''
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}
