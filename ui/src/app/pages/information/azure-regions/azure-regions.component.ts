import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import azureGlobalCloudRegionsJson from '../../../../assets/data/regions.json'
import { Region } from '../../../models'
import { SeoService } from '../../../services'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { HeroIconComponent } from '../../../shared/icons/hero-icons.imports'

@Component({
  selector: 'app-azure-regions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeroIconComponent],
  templateUrl: './azure-regions.component.html',
  styleUrls: ['./azure-regions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureRegionsComponent implements OnInit {
  readonly azureGlobalCloudRegions = signal<Region[]>([])
  readonly accessRestrictedRegions = signal<Region[]>([])
  readonly availableRegionGroups = signal<string[]>([])
  readonly upcomingRegions = [
    {
      country: 'Saudi Arabia',
      name: 'Saudi Arabia East',
      link: 'https://news.microsoft.com/en-xm/2024/12/04/microsoft-shares-strong-progress-on-datacenter-region-in-saudi-arabia-construction-complete-on-three-sites-with-availability-expected-in-2026/'
    },
    {
      country: 'Taiwan',
      name: 'Taiwan North',
      link: 'https://aka.ms/TaiwanIntent'
    },
    {
      country: 'Greece',
      name: 'Greece Central',
      link: 'https://news.microsoft.com/europe/2020/10/05/microsoft-announces-plans-for-first-datacenter-region-in-greece-as-part-of-gr-for-growth-digital-transformation-initiative/'
    },
    {
      country: 'Denmark',
      name: 'Denmark East',
      link: 'https://aka.ms/DenmarkIntent'
    },
    {
      country: 'Belgium',
      name: 'Belgium Central',
      link: 'https://aka.ms/belgiumintent'
    }
  ] as const
  private readonly searchTerm = signal('')
  private readonly selectedGeography = signal('')
  readonly filteredAzureGlobalCloudRegions = computed(() =>
    this.filterRegions(this.azureGlobalCloudRegions(), this.searchTerm(), this.selectedGeography())
  )
  readonly filteredAccessRestrictedRegions = computed(() =>
    this.filterRegions(this.accessRestrictedRegions(), this.searchTerm(), this.selectedGeography())
  )
  readonly searchControl = new FormControl<string>('', { nonNullable: true })
  readonly geographyControl = new FormControl<string>('', { nonNullable: true })
  readonly hasSearchTerm = computed(() => this.searchTerm().length > 0)

  private seoService = inject(SeoService)
  private readonly destroyRef = inject(DestroyRef)

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure Regions and Data Centers')
    this.seoService.setMetaDescription(
      'Explore the available and access restricted Azure regions, including their geography, physical location, availability zones, and paired regions for disaster recovery.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Information/AzureRegions')
  }

  ngOnInit() {
    this.initializeSeoProperties()
    const unrestrictedRegions = azureGlobalCloudRegionsJson.filter((region) => !region.restricted)
    const restrictedRegions = azureGlobalCloudRegionsJson.filter((region) => region.restricted)

    this.azureGlobalCloudRegions.set(unrestrictedRegions)
    this.accessRestrictedRegions.set(restrictedRegions)

    this.availableRegionGroups.set(
      [...new Set(azureGlobalCloudRegionsJson.map((r) => r.regionGroup))].sort()
    )

    this.searchTerm.set(this.searchControl.value.trim())
    this.selectedGeography.set(this.geographyControl.value)

    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.searchTerm.set((value ?? '').trim()))

    this.geographyControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedGeography.set(value ?? ''))
  }

  private filterRegions(
    regions: Region[],
    searchTerm: string,
    selectedGeography: string
  ): Region[] {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return regions.filter((region) => {
      const matchesSearch =
        !normalizedSearch ||
        region.displayName.toLowerCase().includes(normalizedSearch) ||
        region.datacenterLocation.toLowerCase().includes(normalizedSearch)

      const matchesGeography = !selectedGeography || region.regionGroup === selectedGeography

      return matchesSearch && matchesGeography
    })
  }

  clearSearch(): void {
    this.searchControl.setValue('')
  }
}
