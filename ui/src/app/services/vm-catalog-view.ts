import { VmSkuCatalogEntry, VmSkuSummary } from './vm-catalog'

export interface VmCapabilityView {
  readonly name: string
  readonly label: string
  readonly value: string
}

export interface VmSkuSpecs {
  readonly acceleratedNetworking: boolean
  readonly architecture: string
  readonly gpuCount: number | null
  readonly maxDataDisks: number | null
  readonly maxNetworkInterfaces: number | null
  readonly memoryGB: number | null
  readonly premiumIO: boolean
  readonly rdma: boolean
  readonly vcpus: number | null
}

type VmSkuWithCapabilities = Pick<VmSkuCatalogEntry | VmSkuSummary, 'coreCapabilities'>

export const VM_NAME_COLLATOR = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
})
export const VM_NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

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

export function numericVmCapability(sku: VmSkuWithCapabilities, name: string): number | null {
  const value = Number(sku.coreCapabilities[name])
  return Number.isFinite(value) ? value : null
}

export function booleanVmCapability(sku: VmSkuWithCapabilities, name: string): boolean {
  return sku.coreCapabilities[name]?.toLowerCase() === 'true'
}

export function vmCapabilityLabel(name: string): string {
  return CAPABILITY_LABELS[name] ?? name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

export function buildVmCapabilityViews(sku: VmSkuWithCapabilities): readonly VmCapabilityView[] {
  return Object.entries(sku.coreCapabilities)
    .filter((capability): capability is [string, string] => typeof capability[1] === 'string')
    .map(([name, value]) => ({ name, label: vmCapabilityLabel(name), value }))
    .sort((left, right) => VM_NAME_COLLATOR.compare(left.label, right.label))
}

export function buildVmSkuSpecs(sku: VmSkuWithCapabilities): VmSkuSpecs {
  return {
    acceleratedNetworking: booleanVmCapability(sku, 'AcceleratedNetworkingEnabled'),
    architecture: sku.coreCapabilities['CpuArchitectureType'] ?? 'Not listed',
    gpuCount: numericVmCapability(sku, 'GPUs'),
    maxDataDisks: numericVmCapability(sku, 'MaxDataDiskCount'),
    maxNetworkInterfaces: numericVmCapability(sku, 'MaxNetworkInterfaces'),
    memoryGB: numericVmCapability(sku, 'MemoryGB'),
    premiumIO: booleanVmCapability(sku, 'PremiumIO'),
    rdma: booleanVmCapability(sku, 'RdmaEnabled'),
    vcpus: numericVmCapability(sku, 'vCPUs'),
  }
}

export function formatVmNumber(value: number | null): string {
  return value === null ? 'Not listed' : VM_NUMBER_FORMATTER.format(value)
}
