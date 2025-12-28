import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'
import { SERVICE_IP_RANGE_DIRECTORY, ServiceIpRangeEntry } from './service-ip-ranges.data'

interface ServiceDirectoryEntry {
  name: string
  rangeCount: number
  ranges: string[]
}

@Component({
  selector: 'app-azure-ip-ranges-by-service',
  imports: [RouterLink, LucideIconComponent],
  templateUrl: './azure-ip-ranges-by-service.component.html',
  styleUrl: './azure-ip-ranges-by-service.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()'
  }
})
export class AzureIpRangesByServiceComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  readonly services = signal<ServiceDirectoryEntry[]>([])
  readonly selectedServiceId = signal<string | null>(null)
  readonly searchTerm = signal('')

  readonly filteredServices = computed(() => {
    const query = this.searchTerm().trim().toLowerCase()
    if (!query) {
      return this.services()
    }
    return this.services().filter((service) => service.name.toLowerCase().includes(query))
  })

  readonly totalServiceCount = computed(() => this.services().length)
  readonly filteredServiceCount = computed(() => this.filteredServices().length)
  readonly totalRangeCount = computed(() =>
    this.services().reduce((total, service) => total + service.rangeCount, 0)
  )

  ngOnInit(): void {
    this.seoService.setMetaTitle('Explore Azure IP Ranges By Service')
    this.seoService.setMetaDescription(
      'Discover Azure IP ranges for various services globally. This comprehensive list includes IP ranges for Azure services across different regions and countries.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureIpRangesByService')
    this.loadServices()
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? ''
    this.searchTerm.set(value)
  }

  clearSearch(): void {
    this.searchTerm.set('')
  }

  selectService(serviceName: string): void {
    this.selectedServiceId.update((current) => (current === serviceName ? null : serviceName))
  }

  onEscape(): void {
    if (this.selectedServiceId()) {
      this.selectedServiceId.set(null)
    } else if (this.searchTerm()) {
      this.clearSearch()
    }
  }

  isGlobalRange(range: string): boolean {
    return !range.includes('.')
  }

  private loadServices(): void {
    const directory = SERVICE_IP_RANGE_DIRECTORY.map<ServiceDirectoryEntry>(
      (entry: ServiceIpRangeEntry) => ({
        name: entry.service,
        rangeCount: entry.ranges.length,
        ranges: entry.ranges.slice().sort((a, b) => a.localeCompare(b))
      })
    ).sort((a, b) => a.name.localeCompare(b.name))
    this.services.set(directory)
  }
}
