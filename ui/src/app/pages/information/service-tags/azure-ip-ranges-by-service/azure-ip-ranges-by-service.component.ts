import { isPlatformBrowser, Location } from '@angular/common'
import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'

import { SeoService } from '../../../../services/seo.service'
import { buildServiceTagHref } from '../../../../services/service-tag-hrefs'
import { ServiceTagsLoader } from '../../../../services/service-tags-loader.service'
import {
  ServiceTagCloud,
  ServiceTagCloudDirectoryEntry,
  ServiceTagDirectoryItem,
  ServiceTagScope,
  ServiceTagServiceDirectories,
} from '../../../../services/service-tags-snapshot'
import { buildDocumentHref } from '../../../../shared/document-navigation'
import { readInputValue, readSelectValue } from '../../../../shared/form-control-value'
import { LucideIconComponent } from '../../../../shared/icons/lucide-icons.component'
import { replaceMergedQueryParamsIfChanged } from '../../../../shared/query-param-sync'
import {
  absoluteUrl,
  buildFaqPage,
  buildListItems,
  buildSchemaNode,
} from '../../../../shared/structured-data'
import {
  formatDirectoryCount,
  normalizeDirectoryCloud,
  normalizeDirectoryLetter,
  normalizeDirectorySearch,
  normalizeSearchText,
  normalizeSelectedService,
  normalizeServiceTagScope,
  SERVICE_TAG_SCOPE_OPTIONS,
  toDomId,
} from '../service-tag-directory.helpers'

type DirectoryLoadState = 'idle' | 'loading' | 'loaded' | 'error'
type ServiceScopeFilter = ServiceTagScope | ''

interface ServiceViewState {
  readonly search: string
  readonly cloud: ServiceTagCloud
  readonly scope: ServiceScopeFilter
  readonly letter: string
  readonly service: string
}

interface DisplayService {
  readonly name: string
  readonly serviceTags: readonly ServiceTagDirectoryItem[]
}

interface ServiceTagGroup {
  readonly label: string
  readonly headingId: string
  readonly serviceTags: readonly ServiceTagDirectoryItem[]
  readonly global: boolean
}

const PAGE_PATH = '/Information/AzureIpRangesByService'
const PAGE_DESCRIPTION =
  'Explore Azure IP ranges by service and quickly find the network scopes relevant to your architecture.'
const SOURCE_FAQ = {
  question: 'Where do these IP ranges come from, and how often are they updated?',
  answer:
    'This directory uses Microsoft Azure Service Tags data. Microsoft normally publishes downloadable service-tag files weekly. Use the official download for your selected cloud when you need the complete source file.',
} as const
const SERVICE_COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

@Component({
  selector: 'app-azure-ip-ranges-by-service',
  imports: [LucideIconComponent],
  templateUrl: './azure-ip-ranges-by-service.component.html',
  styleUrl: './azure-ip-ranges-by-service.component.css',
  host: {
    class: 'block',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class AzureIpRangesByServiceComponent implements OnInit {
  readonly buildDocumentHref = buildDocumentHref
  private readonly seoService = inject(SeoService)
  private readonly serviceTagsLoader = inject(ServiceTagsLoader)
  private readonly location = inject(Location)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly canSyncUrl = signal(false)
  private readonly retryDirectories = signal<ServiceTagServiceDirectories | null>(null)

  readonly sourceFaq = SOURCE_FAQ
  readonly serviceTagDirectories = input<ServiceTagServiceDirectories | null>(null)
  readonly q = input('', { transform: normalizeDirectorySearch })
  readonly cloud = input<ServiceTagCloud, string | undefined>('public', {
    transform: normalizeDirectoryCloud,
  })
  readonly scope = input<ServiceScopeFilter, string | undefined>('', {
    transform: normalizeServiceTagScope,
  })
  readonly letter = input('', { transform: normalizeDirectoryLetter })
  readonly service = input('', { transform: normalizeSelectedService })

  readonly scopeOptions = SERVICE_TAG_SCOPE_OPTIONS
  readonly loadState = signal<DirectoryLoadState>('idle')
  readonly directories = computed(() => this.retryDirectories() ?? this.serviceTagDirectories())
  readonly cloudOptions = computed(() => this.directories()?.clouds ?? [])
  readonly selectedCloud = computed<ServiceTagCloudDirectoryEntry | undefined>(() =>
    this.cloudOptions().find((option) => option.id === this.filtersModel().cloud)
  )

  private readonly routeViewState = computed<ServiceViewState>(() => ({
    search: this.q(),
    cloud: this.cloud(),
    scope: this.scope(),
    letter: this.letter(),
    service: this.service(),
  }))

  readonly filtersModel = linkedSignal(() => this.routeViewState())
  readonly servicesForSelectedCloud = computed(() => {
    const directories = this.directories()
    const cloud = this.filtersModel().cloud
    return directories?.serviceDirectory.filter((service) => service.cloud === cloud) ?? []
  })
  readonly availableLetters = computed(() => {
    const scope = this.filtersModel().scope
    return [
      ...new Set(
        this.servicesForSelectedCloud()
          .filter(
            (service) =>
              !scope || service.serviceTags.some((serviceTag) => serviceTag.scope === scope)
          )
          .map((service) => service.service.charAt(0).toUpperCase())
          .filter((letter) => /^[A-Z]$/.test(letter))
      ),
    ].sort()
  })
  readonly filteredServices = computed<readonly DisplayService[]>(() => {
    const { search, scope, letter } = this.filtersModel()
    const normalizedSearch = normalizeSearchText(search.trim())

    return this.servicesForSelectedCloud()
      .filter((service) => !letter || service.service.toUpperCase().startsWith(letter))
      .map((service) => {
        const serviceMatches = normalizeSearchText(service.service).includes(normalizedSearch)
        const serviceTags = service.serviceTags.filter((serviceTag) => {
          if (scope && serviceTag.scope !== scope) return false
          if (!normalizedSearch || serviceMatches) return true

          return [
            serviceTag.serviceTagId,
            serviceTag.regionId,
            serviceTag.regionDisplayName,
            serviceTag.regionGroup,
          ].some((value) => normalizeSearchText(value).includes(normalizedSearch))
        })

        return { name: service.service, serviceTags }
      })
      .filter((service) => service.serviceTags.length > 0)
      .sort((left, right) => SERVICE_COLLATOR.compare(left.name, right.name))
  })
  readonly filteredServiceTagCount = computed(() =>
    this.filteredServices().reduce((total, service) => total + service.serviceTags.length, 0)
  )
  readonly selectedScopeServiceTagCount = computed(() => {
    const scope = this.filtersModel().scope
    return this.servicesForSelectedCloud().reduce(
      (total, service) =>
        total +
        service.serviceTags.filter((serviceTag) => !scope || serviceTag.scope === scope).length,
      0
    )
  })
  readonly selectedService = computed(() => {
    const selectedName = this.filtersModel().service
    return this.filteredServices().find((service) => service.name === selectedName)
  })
  readonly selectedServiceGroups = computed<readonly ServiceTagGroup[]>(() => {
    const serviceTags = this.selectedService()?.serviceTags ?? []
    const groups = new Map<string, ServiceTagDirectoryItem[]>()

    for (const serviceTag of serviceTags) {
      const label = serviceTag.scope === 'global' ? 'Global tags' : serviceTag.regionGroup
      const existing = groups.get(label)
      if (existing) existing.push(serviceTag)
      else groups.set(label, [serviceTag])
    }

    return [...groups.entries()]
      .map(([label, groupedServiceTags]) => ({
        label,
        headingId: toDomId('service-tag-scope', `${this.filtersModel().service}-${label}`),
        serviceTags: [...groupedServiceTags].sort((left, right) =>
          SERVICE_COLLATOR.compare(
            left.regionDisplayName || left.serviceTagId,
            right.regionDisplayName || right.serviceTagId
          )
        ),
        global: label === 'Global tags',
      }))
      .sort((left, right) => {
        if (left.global !== right.global) return left.global ? -1 : 1
        return SERVICE_COLLATOR.compare(left.label, right.label)
      })
  })

  readonly resultSummary = computed(() => {
    const filteredServices = this.filteredServices().length
    const totalServices = this.servicesForSelectedCloud().length
    const filteredTags = this.filteredServiceTagCount()
    const totalTags = this.selectedScopeServiceTagCount()
    const cloudLabel = this.selectedCloud()?.label ?? 'Azure Public'
    return `Showing ${formatDirectoryCount(filteredServices)} of ${formatDirectoryCount(totalServices)} services and ${formatDirectoryCount(filteredTags)} of ${formatDirectoryCount(totalTags)} service tags in ${cloudLabel}`
  })
  readonly hasActiveFilters = computed(() => {
    const { search, scope, letter } = this.filtersModel()
    return Boolean(search.trim() || scope || letter)
  })

  constructor() {
    if (this.isBrowser) {
      afterNextRender(() => this.canSyncUrl.set(true))

      effect(() => {
        if (!this.canSyncUrl()) return
        this.syncUrlState(this.filtersModel(), this.routeViewState())
      })
    }
  }

  ngOnInit(): void {
    const defaultServices =
      this.serviceTagDirectories()?.serviceDirectory.filter(
        (service) => service.cloud === 'public'
      ) ?? []

    this.seoService.setPageMeta({
      title: 'Azure IP Ranges by Service | Microsoft Service Tags',
      description: PAGE_DESCRIPTION,
      canonicalUrl: absoluteUrl(PAGE_PATH),
      structuredData: [
        buildSchemaNode('CollectionPage', {
          name: 'Azure IP ranges by service',
          description: PAGE_DESCRIPTION,
          url: absoluteUrl(PAGE_PATH),
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: defaultServices.length,
            itemListElement: buildListItems(
              defaultServices.map((service) => ({
                name: service.service,
                path: `${PAGE_PATH}?service=${encodeURIComponent(service.service)}`,
              }))
            ),
          },
        }),
        buildFaqPage([SOURCE_FAQ]),
      ],
    })
  }

  clearFilters(): void {
    this.filtersModel.update((state) => ({
      ...state,
      search: '',
      scope: '',
      letter: '',
      service: '',
    }))
  }

  clearSearch(): void {
    this.filtersModel.update((state) => ({ ...state, search: '' }))
  }

  clearSelectedService(): void {
    this.filtersModel.update((state) => ({ ...state, service: '' }))
  }

  updateSearch(event: Event): void {
    const search = normalizeDirectorySearch(readInputValue(event))
    this.filtersModel.update((state) => ({ ...state, search }))
  }

  // Changing cloud or scope also drops the selected service, matching the previous
  // [formField] + (change)="clearSelectedService()" pairing on these selects.
  updateCloud(event: Event): void {
    const cloud = normalizeDirectoryCloud(readSelectValue(event))
    this.filtersModel.update((state) => ({ ...state, cloud, service: '' }))
  }

  updateScope(event: Event): void {
    const scope = normalizeServiceTagScope(readSelectValue(event))
    this.filtersModel.update((state) => ({ ...state, scope, service: '' }))
  }

  selectLetter(letter: string): void {
    this.filtersModel.update((state) => ({
      ...state,
      letter: state.letter === letter ? '' : letter,
      service: '',
    }))
  }

  selectService(serviceName: string): void {
    this.filtersModel.update((state) => ({
      ...state,
      service: state.service === serviceName ? '' : serviceName,
    }))
  }

  onEscape(): void {
    if (this.filtersModel().service) {
      this.clearSelectedService()
    } else if (this.filtersModel().search) {
      this.clearSearch()
    }
  }

  serviceTagHref(serviceTag: ServiceTagDirectoryItem): string {
    return buildServiceTagHref(
      this.filtersModel().cloud,
      serviceTag.serviceTagId,
      serviceTag.requiresCloudRoute
    )
  }

  servicePanelId(serviceName: string): string {
    return toDomId('service-panel', serviceName)
  }

  cloudQueryParams(): { cloud: ServiceTagCloud } | undefined {
    const cloud = this.filtersModel().cloud
    return cloud === 'public' ? undefined : { cloud }
  }

  async retryLoad(): Promise<void> {
    if (this.loadState() === 'loading') return
    this.loadState.set('loading')

    try {
      this.retryDirectories.set(await this.serviceTagsLoader.reloadServiceDirectories())
      this.loadState.set('loaded')
    } catch {
      this.loadState.set('error')
    }
  }

  private syncUrlState(nextState: ServiceViewState, routeState: ServiceViewState): void {
    replaceMergedQueryParamsIfChanged(
      { router: this.router, route: this.route, location: this.location },
      this.buildQueryParams(nextState),
      this.buildQueryParams(routeState)
    )
  }

  private buildQueryParams(state: ServiceViewState): Record<string, string | null> {
    const search = state.search.trim()
    return {
      q: search || null,
      cloud: state.cloud === 'public' ? null : state.cloud,
      scope: state.scope || null,
      letter: state.letter || null,
      service: state.service || null,
    }
  }
}
