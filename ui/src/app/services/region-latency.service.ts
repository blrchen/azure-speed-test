import { Service } from '@angular/core'

import regionLatencyMatrixJson from '../../assets/data/region-latency-matrix.json'
import { RegionLatencyMatrix, RegionLatencyResult } from '../models'

@Service()
export class RegionLatencyService {
  private readonly matrix: RegionLatencyMatrix = regionLatencyMatrixJson
  private readonly sourceKeyToLatencies = new Map<string, (number | null)[]>()

  constructor() {
    for (const row of this.matrix.rows) {
      this.sourceKeyToLatencies.set(this.normalizeName(row.source), row.latencies)
    }
  }

  getSourceRegions(): string[] {
    return [...this.matrix.sourceRegions]
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
    return this.matrix.maxPublishedLatency
  }

  private normalizeName(value: string): string {
    return value
      .replace(/\u00a0/g, ' ')
      .trim()
      .toLowerCase()
  }
}
