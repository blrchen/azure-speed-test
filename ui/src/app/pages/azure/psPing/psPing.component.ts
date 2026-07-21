import { NgOptimizedImage } from '@angular/common'
import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { RegionService } from '../../../services/region.service'
import { SeoService } from '../../../services/seo.service'
import { CopyButtonComponent } from '../../../shared/copy-button/copy-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

const DEFAULT_REGION_ID = 'westus'
const SAMPLE_OPTIONS: readonly number[] = [10, 20, 50, 100]
const WARMUP_OPTIONS: readonly number[] = [1, 3, 5, 10]

interface TestComparisonRow {
  readonly aspect: string
  readonly browser: string
  readonly psPing: string
}

@Component({
  selector: 'app-psping',
  imports: [CopyButtonComponent, LucideIconComponent, NgOptimizedImage, RouterLink],
  templateUrl: './psPing.component.html',
  host: { class: 'block' },
})
export class PSPingComponent implements OnInit {
  private readonly regionService = inject(RegionService)
  private readonly seoService = inject(SeoService)

  protected readonly regionGroups = this.regionService.getRegionGroups()
  private readonly allRegions = this.regionService.getAllRegions()
  private readonly regionsById = new Map(
    this.allRegions.map((region) => [region.regionId, region] as const)
  )
  private readonly defaultRegionId = this.regionsById.has(DEFAULT_REGION_ID)
    ? DEFAULT_REGION_ID
    : this.allRegions[0].regionId

  protected readonly sampleOptions = SAMPLE_OPTIONS
  protected readonly warmupOptions = WARMUP_OPTIONS
  protected readonly selectedRegionId = signal(this.defaultRegionId)
  protected readonly sampleCount = signal(20)
  protected readonly warmupCount = signal(5)
  protected readonly selectedRegion = computed(
    () => this.regionsById.get(this.selectedRegionId()) ?? this.allRegions[0]
  )
  protected readonly endpoint = computed(
    () => `${this.selectedRegion().storageAccountName}.blob.core.windows.net`
  )
  protected readonly command = computed(
    () => `psping.exe -n ${this.sampleCount()} -w ${this.warmupCount()} ${this.endpoint()}:443`
  )
  protected readonly browserLatencyQueryParams = computed(() => ({
    regions: this.selectedRegion().regionId,
  }))

  protected readonly comparisonRows: readonly TestComparisonRow[] = [
    {
      aspect: 'Measurement',
      browser:
        'Browser-observed HTTPS request duration. Connection reuse means DNS and TLS are not included in every sample.',
      psPing:
        'TCP connection establishment time to one host and port, or ICMP round-trip time when the target supports ICMP.',
    },
    {
      aspect: 'Best for',
      browser:
        'Comparing the experience of reaching the public Azure Storage endpoints used by this site.',
      psPing:
        'Repeatable command-line diagnostics, TCP port checks, and controlled host-to-host testing.',
    },
    {
      aspect: 'Limitations',
      browser:
        'Affected by browser scheduling, protocol behavior, connection reuse, and the public service endpoint.',
      psPing:
        'A TCP connect test does not measure application response time or VM-to-VM payload latency.',
    },
    {
      aspect: 'Requirements',
      browser: 'A modern browser. No download or installation is required.',
      psPing: 'Windows 8.1 or later, or Windows Server 2012 or later, plus PsTools.',
    },
  ]

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'PsPing Azure Latency Test and Command Generator',
      description:
        'Generate a PsPing command to test TCP connection latency to Azure region endpoints, understand the results, and compare PsPing with browser latency tests.',
      canonicalUrl: 'https://www.azurespeed.com/Azure/PsPing',
    })
  }

  protected selectRegion(event: Event): void {
    const regionId = getSelectValue(event)
    if (this.regionsById.has(regionId)) {
      this.selectedRegionId.set(regionId)
    }
  }

  protected selectSampleCount(event: Event): void {
    const value = getSelectNumber(event)
    if (SAMPLE_OPTIONS.includes(value)) {
      this.sampleCount.set(value)
    }
  }

  protected selectWarmupCount(event: Event): void {
    const value = getSelectNumber(event)
    if (WARMUP_OPTIONS.includes(value)) {
      this.warmupCount.set(value)
    }
  }
}

function getSelectValue(event: Event): string {
  return event.target instanceof HTMLSelectElement ? event.target.value : ''
}

function getSelectNumber(event: Event): number {
  return Number.parseInt(getSelectValue(event), 10)
}
