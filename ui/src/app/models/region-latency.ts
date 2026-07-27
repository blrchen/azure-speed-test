export interface RegionLatencyMatrix {
  destinations: string[]
  rows: { source: string; latencies: (number | null)[] }[]
  sourceRegions: string[]
  maxPublishedLatency: number
}

export interface RegionLatencyResult {
  destinationDisplayName: string
  latencyMs: number | null
}
