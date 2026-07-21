import { Service } from '@angular/core'

import regionLatencyMatrixJson from '../../assets/data/region-latency-matrix.json'
import { RegionLatencyMatrix, RegionLatencyResult } from '../models'
import { REGION_NAME_COLLATOR } from '../shared/utils'

@Service()
export class RegionLatencyService {
  private readonly matrix: RegionLatencyMatrix
  private readonly sourceKeyToLatencies = new Map<string, (number | null)[]>()
  private readonly sourceRegions: string[]
  private readonly maxPublishedLatency: number
  private readonly collator = REGION_NAME_COLLATOR

  constructor() {
    this.matrix = regionLatencyMatrixJson

    for (const row of this.matrix.rows) {
      this.sourceKeyToLatencies.set(this.normalizeName(row.source), row.latencies)
    }

    const sourceRegions = this.matrix.rows
      .filter((row) =>
        row.latencies.some((latency) => typeof latency === 'number' && Number.isFinite(latency))
      )
      .map((row) => row.source)
    const sourceKeys = new Set(sourceRegions.map((source) => this.normalizeName(source)))

    for (const [destinationIndex, destination] of this.matrix.destinations.entries()) {
      const destinationKey = this.normalizeName(destination)
      const hasPublishedReverseRoute = this.matrix.rows.some((row) =>
        Number.isFinite(row.latencies[destinationIndex])
      )
      if (!sourceKeys.has(destinationKey) && hasPublishedReverseRoute) {
        sourceRegions.push(destination)
        sourceKeys.add(destinationKey)
      }
    }

    this.sourceRegions = sourceRegions.sort((a, b) => this.collator.compare(a, b))

    this.maxPublishedLatency = this.matrix.rows.reduce<number>(
      (matrixMax, row) =>
        row.latencies.reduce<number>(
          (rowMax, latency) =>
            typeof latency === 'number' && Number.isFinite(latency)
              ? Math.max(rowMax, latency)
              : rowMax,
          matrixMax
        ),
      0
    )
  }

  getSourceRegions(): string[] {
    return [...this.sourceRegions]
  }

  getLatenciesForSource(source: string): RegionLatencyResult[] {
    const sourceKey = this.normalizeName(source)
    const latencies = this.sourceKeyToLatencies.get(sourceKey)
    if (latencies) {
      return this.matrix.destinations.map((destinationDisplayName, index) => ({
        destinationDisplayName,
        latencyMs: latencies[index] ?? null,
      }))
    }

    const destinationIndex = this.matrix.destinations.findIndex(
      (destination) => this.normalizeName(destination) === sourceKey
    )
    if (destinationIndex < 0) return []

    return this.matrix.rows.map((row) => ({
      destinationDisplayName: row.source,
      latencyMs: row.latencies[destinationIndex] ?? null,
    }))
  }

  getMaxPublishedLatency(): number {
    return this.maxPublishedLatency
  }

  private normalizeName(value: string): string {
    return value
      .replace(/\u00a0/g, ' ')
      .trim()
      .toLowerCase()
  }
}
