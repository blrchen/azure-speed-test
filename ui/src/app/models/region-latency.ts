export interface RegionLatencyMatrix {
  destinations: string[]
  rows: { source: string; latencies: (number | null)[] }[]
}

export interface RegionLatencyResult {
  destinationDisplayName: string
  latencyMs: number | null
}
