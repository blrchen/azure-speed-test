import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
  RouterLink,
  RouterOutlet
} from '@angular/router'

import { FooterComponent } from './shared/footer/footer.component'
import { LucideIconComponent } from './shared/icons/lucide-icons.component'
import { NavGroup, NavGroupsComponent } from './shared/nav-groups/nav-groups.component'
import { ThemeToggleComponent } from './shared/theme'

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    FooterComponent,
    NavGroupsComponent,
    LucideIconComponent,
    ThemeToggleComponent
  ],
  host: {
    '(document:keydown.escape)': 'handleEscapeKey()'
  },
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)

  readonly mobileNavOpen = signal(false)
  readonly isRouteLoading = signal(false)
  private readonly hasCompletedInitialNavigation = signal(false)
  readonly showRouteLoader = computed(
    () => this.hasCompletedInitialNavigation() && this.isRouteLoading()
  )

  readonly navGroups = signal<NavGroup[]>([
    {
      heading: 'Featured',
      items: [
        {
          label: 'ChatGPT Coding Assistant',
          icon: 'braces',
          routerLink: '/ChatGPT/CodeAssistant'
        },
        {
          label: 'ChatGPT Writing Assistant',
          icon: 'pencil',
          routerLink: '/ChatGPT/WritingAssistant'
        }
      ]
    },
    {
      heading: 'Testing',
      items: [
        {
          label: 'Azure Latency Test',
          icon: 'zap',
          routerLink: '/Azure/Latency'
        },
        {
          label: 'Region to Region Latency',
          icon: 'arrow-left-right',
          routerLink: '/Azure/RegionToRegionLatency'
        },
        {
          label: 'PsPing Network Latency Test',
          icon: 'signal-high',
          routerLink: '/Azure/PsPing'
        },
        {
          label: 'Download Speed Test',
          icon: 'download',
          routerLink: '/Azure/Download'
        },
        {
          label: 'Upload Speed Test',
          icon: 'upload',
          routerLink: '/Azure/Upload'
        },
        {
          label: 'Large File Upload Speed Test',
          icon: 'upload-cloud',
          routerLink: '/Azure/UploadLargeFile'
        }
      ]
    },
    {
      heading: 'Resources',
      items: [
        {
          label: 'Azure Regions',
          icon: 'globe-2',
          routerLink: '/Information/AzureRegions'
        },
        {
          label: 'Azure Availability Zones',
          icon: 'server',
          routerLink: '/Information/AzureAvailabilityZones'
        },
        {
          label: 'Azure Geographies',
          icon: 'globe',
          routerLink: '/Information/AzureGeographies'
        },
        {
          label: 'Azure Sovereign Clouds',
          icon: 'cloud',
          routerLink: '/Information/AzureSovereignClouds'
        },
        {
          label: 'Azure Environments',
          icon: 'cog',
          routerLink: '/Information/AzureEnvironments'
        }
      ]
    },
    {
      heading: 'IP Tools',
      items: [
        {
          label: 'Azure IP Lookup',
          icon: 'search',
          routerLink: '/Azure/IPLookup'
        },
        {
          label: 'Azure IP Ranges',
          icon: 'map',
          routerLink: '/Information/AzureIpRanges/AzureCloud'
        },
        {
          label: 'Azure IP Ranges By Region',
          icon: 'map-pin',
          routerLink: '/Information/AzureIpRangesByRegion'
        },
        {
          label: 'Azure IP Ranges By Service',
          icon: 'bar-chart-3',
          routerLink: '/Information/AzureIpRangesByService'
        }
      ]
    },
    {
      heading: 'Info',
      items: [
        {
          label: 'About',
          icon: 'info',
          routerLink: '/Azure/About'
        }
      ]
    }
  ])

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart || event instanceof RouteConfigLoadStart) {
        if (this.hasCompletedInitialNavigation()) {
          this.isRouteLoading.set(true)
        }
        return
      }

      if (
        event instanceof RouteConfigLoadEnd ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isRouteLoading.set(false)
        if (!this.hasCompletedInitialNavigation()) {
          this.hasCompletedInitialNavigation.set(true)
        }
      }
    })
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open)
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false)
  }

  handleMobileNavigate(): void {
    this.closeMobileNav()
  }

  handleEscapeKey(): void {
    if (this.mobileNavOpen()) {
      this.closeMobileNav()
    }
  }
}
