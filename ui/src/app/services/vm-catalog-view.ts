import { VM_MONTHLY_HOURS, VmSkuCatalogEntry, VmSkuSpecs } from './vm-catalog'

export type { VmSkuSpecs } from './vm-catalog'

interface VmCapabilityView {
  readonly name: string
  readonly label: string
  readonly value: string
}

export interface VmSkuCpuDetails {
  readonly availableVcpus: number | null
  readonly baseVcpus: number | null
  readonly isConstrained: boolean
}

export interface VmSkuStoragePerformance {
  readonly diskControllerTypes: string | null
  readonly uncachedDiskBytesPerSecond: number | null
  readonly uncachedDiskIops: number | null
}

export interface VmSkuNameSegment {
  readonly value: string
  readonly label: string
  readonly description: string
}

interface VmNamePrefix {
  readonly family: string
  readonly modifier?: Pick<VmSkuNameSegment, 'description' | 'label'>
  /**
   * Set for the pre-v3 series whose number is a catalog index rather than a vCPU
   * count. `Standard_D2` happens to have 2 vCPUs and `Standard_D3` has 4, so the
   * digit cannot be validated against the capability value for these families.
   */
  readonly numberIsSizeIndex?: true
}

type VmSkuWithCapabilities = Pick<VmSkuCatalogEntry, 'coreCapabilities'>

export const VM_NAME_COLLATOR = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
})
export const VM_NUMBER_FORMATTER = new Intl.NumberFormat('en-US')
const VM_DATA_RATE_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})
const VM_HOURLY_PRICE_FORMATTERS = new Map<string, Intl.NumberFormat>()
const VM_MONTHLY_PRICE_FORMATTERS = new Map<string, Intl.NumberFormat>()

const CAPABILITY_LABELS: Readonly<Record<string, string>> = {
  ACUs: 'Azure compute units',
  AcceleratedNetworkingEnabled: 'Accelerated networking',
  CachedDiskBytes: 'Cached disk bytes',
  CombinedTempDiskAndCachedIOPS: 'Temp and cached disk IOPS',
  CombinedTempDiskAndCachedReadBytesPerSecond: 'Temp and cached read bytes/sec',
  CombinedTempDiskAndCachedWriteBytesPerSecond: 'Temp and cached write bytes/sec',
  ConfidentialComputingType: 'Confidential computing',
  CpuArchitectureType: 'CPU architecture',
  DiskControllerTypes: 'Disk controllers',
  GPUs: 'GPUs',
  HyperVGenerations: 'Hyper-V generations',
  MaxDataDiskCount: 'Maximum data disks',
  MaxNetworkInterfaces: 'Maximum network interfaces',
  MaxResourceVolumeMB: 'Resource volume MB',
  MaxWriteAcceleratorDisksAllowed: 'Write Accelerator disks',
  MemoryGB: 'Memory (GB)',
  NvmeDiskSizeInMiB: 'NVMe disk size MiB',
  NvmeMaxReadBytesPerSecond: 'NVMe max read bytes/sec',
  NvmeMaxReadIops: 'NVMe max read IOPS',
  NvmeMaxWriteBytesPerSecond: 'NVMe max write bytes/sec',
  NvmeMaxWriteIops: 'NVMe max write IOPS',
  NvmeSizePerDiskInMiB: 'NVMe size per disk MiB',
  OSVhdSizeMB: 'OS VHD size MB',
  PremiumIO: 'Premium storage',
  RdmaEnabled: 'RDMA',
  SupportedVirtualizationTypes: 'Virtualization types',
  UncachedDiskBytesPerSecond: 'Uncached disk bytes/sec',
  UncachedDiskIOPS: 'Uncached disk IOPS',
  vCPUs: 'vCPUs',
  vCPUsAvailable: 'Available vCPUs',
  vCPUsPerCore: 'vCPUs per core',
}

// Additive feature letters and subfamily letters as published in the Microsoft
// "Azure VM sizes naming conventions" reference.
const VM_NAME_FEATURE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  a: 'AMD-based processor',
  b: 'Remote storage bandwidth optimized',
  d: 'Includes a local temporary disk',
  e: 'Encrypted; contains confidential TDX capabilities',
  f: 'Flat 1:1 ratio of vCPU to memory size',
  i: 'Isolated size',
  l: 'Low memory; decreased vCPU to memory ratio',
  m: 'Memory intensive; highest vCPU to memory ratio in the series',
  n: 'Network optimized; increased vCPU to network bandwidth ratio',
  o: 'Increased vCPU to local SSD storage capacity ratio',
  p: 'Arm-based processor',
  r: 'Includes an RDMA (InfiniBand) secondary network',
  s: 'Compatible with any Premium SSD type',
  t: 'Tiny memory; smallest vCPU to memory ratio in the size',
}
// The same letter means different things depending on its family, so the leading
// prefix is resolved as a whole: the "B" in HB is memory bandwidth while the "B"
// in PB is an FPGA part, and the "S" in the legacy DS/GS names is the premium
// storage feature rather than a subfamily.
const VM_NAME_PREFIXES: Readonly<Record<string, VmNamePrefix | undefined>> = {
  A: { family: 'A' },
  B: { family: 'B' },
  D: { family: 'D' },
  DC: { family: 'D', modifier: { label: 'Subfamily', description: 'Confidential computing' } },
  DS: {
    family: 'D',
    modifier: { label: 'Additive feature', description: 'Compatible with any Premium SSD type' },
  },
  E: { family: 'E' },
  EC: { family: 'E', modifier: { label: 'Subfamily', description: 'Confidential computing' } },
  F: { family: 'F' },
  FX: { family: 'F', modifier: { label: 'Subfamily', description: 'Extra memory' } },
  G: { family: 'G', numberIsSizeIndex: true },
  GS: {
    family: 'G',
    modifier: { label: 'Additive feature', description: 'Compatible with any Premium SSD type' },
    numberIsSizeIndex: true,
  },
  HB: { family: 'H', modifier: { label: 'Subfamily', description: 'Memory bandwidth optimized' } },
  HC: { family: 'H', modifier: { label: 'Subfamily', description: 'Compute intensive' } },
  HX: { family: 'H', modifier: { label: 'Subfamily', description: 'Extra memory' } },
  L: { family: 'L' },
  M: { family: 'M' },
  NC: { family: 'N', modifier: { label: 'Subfamily', description: 'Compute intensive' } },
  NCC: {
    family: 'N',
    modifier: { label: 'Subfamily', description: 'Compute intensive with confidential computing' },
  },
  ND: {
    family: 'N',
    modifier: { label: 'Subfamily', description: 'AI training and inference optimized' },
  },
  NG: {
    family: 'N',
    modifier: { label: 'Subfamily', description: 'Cloud gaming and remote desktop optimized' },
  },
  NP: { family: 'N', modifier: { label: 'Subfamily', description: 'FPGA accelerated' } },
  NV: {
    family: 'N',
    modifier: { label: 'Subfamily', description: 'Visualization and graphics optimized' },
  },
  PB: { family: 'P', modifier: { label: 'Subfamily', description: 'FPGA accelerated' } },
}
// Segment values that are neither a version nor a memory capacity. Anything not
// listed here is reported as a hardware accelerator, which is how Azure names
// GPU and FPGA SKUs launched from Q3 2020 onward.
const VM_NAME_EXTRA_SEGMENT_DESCRIPTIONS: Readonly<Record<string, string>> = {
  cc: 'Confidential computing with a hardware-based trusted execution environment',
  NDR: 'NDR InfiniBand interconnect',
  Promo: 'Promotional pricing variant of the base size',
  xl: 'Extra-large memory configuration of the accelerator',
}
const VM_NAME_SEGMENT_PATTERN = /^([A-Za-z]+?)(\d+)(?:-(\d+))?([a-z]*)$/
// D and DS numbered by catalog index through v2 (D11 has 2 vCPUs, D2 has 2) and by
// vCPU count from v3 onward. Version is the only reliable discriminator, because a
// low index such as D2 can coincidentally equal its vCPU count.
const VM_INDEX_NUMBERED_PREFIXES = new Set(['D', 'DS'])
const VM_INDEX_NUMBERED_MAX_VERSION = 2

function numericVmCapability(sku: VmSkuWithCapabilities, name: string): number | null {
  const value = Number(sku.coreCapabilities[name])
  return Number.isFinite(value) ? value : null
}

function booleanVmCapability(sku: VmSkuWithCapabilities, name: string): boolean {
  return sku.coreCapabilities[name]?.toLowerCase() === 'true'
}

function vmCapabilityLabel(name: string): string {
  return CAPABILITY_LABELS[name] ?? name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

export function buildVmCapabilityViews(sku: VmSkuWithCapabilities): readonly VmCapabilityView[] {
  return Object.entries(sku.coreCapabilities)
    .filter((capability): capability is [string, string] => typeof capability[1] === 'string')
    .map(([name, value]) => ({ name, label: vmCapabilityLabel(name), value }))
    .sort((left, right) => VM_NAME_COLLATOR.compare(left.label, right.label))
}

export function buildVmSkuCpuDetails(sku: VmSkuWithCapabilities): VmSkuCpuDetails {
  const baseVcpus = numericVmCapability(sku, 'vCPUs')
  const availableVcpus = numericVmCapability(sku, 'vCPUsAvailable') ?? baseVcpus
  return {
    availableVcpus,
    baseVcpus,
    isConstrained: availableVcpus !== null && baseVcpus !== null && availableVcpus < baseVcpus,
  }
}

/**
 * Splits an ARM SKU name into the segments defined by the Microsoft naming
 * convention: family, subfamily, vCPUs, constrained vCPUs, additive features,
 * accelerator type, memory capacity, and version. Returns an empty list when the
 * leading segment does not match the documented shape, so callers can hide the
 * breakdown instead of rendering a partial guess.
 *
 * The numeric segments are described from the SKU's own Resource SKUs values
 * rather than from the digits alone, because legacy sizes such as `Standard_D11`
 * and `Standard_GS5` use the number as a size index instead of a vCPU count.
 */
export function buildVmSkuNameSegments(
  sku: VmSkuWithCapabilities & { readonly sku: string }
): readonly VmSkuNameSegment[] {
  const { baseVcpus } = buildVmSkuCpuDetails(sku)
  const memoryGB = numericVmCapability(sku, 'MemoryGB')
  const [leadingSegment, ...remainingSegments] = sku.sku.replace(/^Standard_/i, '').split('_')
  const match = VM_NAME_SEGMENT_PATTERN.exec(leadingSegment)
  if (!match) return []

  const [, prefix, sizeNumber, constrainedVcpus, featureLetters] = match
  const normalizedPrefix = prefix.toUpperCase()
  const resolvedPrefix = VM_NAME_PREFIXES[normalizedPrefix]
  if (!resolvedPrefix) return []

  const { family, modifier } = resolvedPrefix
  const version = remainingSegments
    .map((segment) => /^v(\d+)$/.exec(segment)?.[1])
    .find((value) => value !== undefined)
  const numberIsSizeIndex =
    resolvedPrefix.numberIsSizeIndex ??
    (VM_INDEX_NUMBERED_PREFIXES.has(normalizedPrefix) &&
      Number(version ?? 1) <= VM_INDEX_NUMBERED_MAX_VERSION)
  const segments: VmSkuNameSegment[] = [
    {
      value: prefix.slice(0, family.length),
      label: 'Family',
      description: `${family}-family size series`,
    },
  ]
  if (modifier) {
    segments.push({ value: prefix.slice(family.length), ...modifier })
  }
  segments.push(
    !numberIsSizeIndex && baseVcpus !== null && Number(sizeNumber) === baseVcpus
      ? {
          value: sizeNumber,
          label: 'vCPUs',
          description: `${sizeNumber} vCPU${sizeNumber === '1' ? '' : 's'} in the base size`,
        }
      : {
          value: sizeNumber,
          label: 'Size number',
          description:
            baseVcpus === null
              ? 'Relative position of this size within the series'
              : `Relative position within the series; this size has ${baseVcpus} vCPU${baseVcpus === 1 ? '' : 's'}`,
        }
  )
  if (constrainedVcpus) {
    segments.push({
      value: `-${constrainedVcpus}`,
      label: 'Constrained vCPUs',
      description: `Only ${constrainedVcpus} vCPUs are active, which lowers per-core licensing costs`,
    })
  }
  for (const letter of featureLetters) {
    segments.push({
      value: letter,
      label: 'Additive feature',
      description: VM_NAME_FEATURE_DESCRIPTIONS[letter] ?? 'Additional size feature',
    })
  }
  for (const segment of remainingSegments) {
    // Case-sensitive on purpose: Azure versions are lower-case `vN`, while
    // upper-case `V620`/`V710` are GPU model names, not generations.
    if (/^v\d+$/.test(segment)) {
      segments.push({
        value: `_${segment}`,
        label: 'Version',
        description: `Generation ${segment.slice(1)} of this series`,
      })
      continue
    }
    if (/^\d+$/.test(segment)) {
      // Azure labels this segment in whole TiB, but the label is nominal: the
      // 10 TiB tier reports 9,496 GB. Quote the published memory instead.
      segments.push({
        value: `_${segment}`,
        label: 'Memory capacity',
        description:
          memoryGB === null
            ? `Approximately ${segment} TiB memory tier`
            : `${segment} TiB memory tier (${formatVmNumber(memoryGB)} GB published)`,
      })
      continue
    }
    segments.push({
      value: `_${segment}`,
      label: VM_NAME_EXTRA_SEGMENT_DESCRIPTIONS[segment] ? 'Feature' : 'Accelerator type',
      description: VM_NAME_EXTRA_SEGMENT_DESCRIPTIONS[segment] ?? `${segment} hardware accelerator`,
    })
  }
  return segments
}

export function buildVmSkuStoragePerformance(sku: VmSkuWithCapabilities): VmSkuStoragePerformance {
  return {
    diskControllerTypes: sku.coreCapabilities['DiskControllerTypes'] ?? null,
    uncachedDiskBytesPerSecond: numericVmCapability(sku, 'UncachedDiskBytesPerSecond'),
    uncachedDiskIops: numericVmCapability(sku, 'UncachedDiskIOPS'),
  }
}

export function buildVmSkuSpecs(sku: VmSkuWithCapabilities): VmSkuSpecs {
  const cpuDetails = buildVmSkuCpuDetails(sku)
  return {
    acceleratedNetworking: booleanVmCapability(sku, 'AcceleratedNetworkingEnabled'),
    architecture: sku.coreCapabilities['CpuArchitectureType'] ?? null,
    confidentialComputingType: sku.coreCapabilities['ConfidentialComputingType'] ?? null,
    gpuCount: numericVmCapability(sku, 'GPUs'),
    hasTempDisk: (numericVmCapability(sku, 'MaxResourceVolumeMB') ?? 0) > 0,
    maxDataDisks: numericVmCapability(sku, 'MaxDataDiskCount'),
    maxNetworkInterfaces: numericVmCapability(sku, 'MaxNetworkInterfaces'),
    memoryGB: numericVmCapability(sku, 'MemoryGB'),
    premiumIO: booleanVmCapability(sku, 'PremiumIO'),
    rdma: booleanVmCapability(sku, 'RdmaEnabled'),
    vcpus: cpuDetails.availableVcpus,
  }
}

export function formatVmNumber(value: number | null): string {
  return value === null ? 'N/A' : VM_NUMBER_FORMATTER.format(value)
}

export function formatVmBytesPerSecond(value: number | null): string {
  return value === null ? 'N/A' : `${VM_DATA_RATE_FORMATTER.format(value / 1_000_000)} MB/s`
}

export function formatVmHourlyPrice(value: number | null, currencyCode: string): string {
  if (value === null) return 'N/A'
  let formatter = VM_HOURLY_PRICE_FORMATTERS.get(currencyCode)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    })
    VM_HOURLY_PRICE_FORMATTERS.set(currencyCode, formatter)
  }
  return formatter.format(value)
}

export function formatVmMonthlyPrice(value: number | null, currencyCode: string): string {
  if (value === null) return 'N/A'
  let formatter = VM_MONTHLY_PRICE_FORMATTERS.get(currencyCode)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    })
    VM_MONTHLY_PRICE_FORMATTERS.set(currencyCode, formatter)
  }
  return formatter.format(value * VM_MONTHLY_HOURS)
}
