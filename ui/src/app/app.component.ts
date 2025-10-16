import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { RouterLink, RouterOutlet } from '@angular/router'
import { FooterComponent } from './shared/footer/footer.component'
import { HeroIconComponent } from './shared/icons/hero-icons.imports'
import { NavGroup, NavGroupsComponent } from './shared/nav-groups/nav-groups.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    FooterComponent,
    NavGroupsComponent,
    HeroIconComponent
  ],
  host: {
    '(document:keydown.escape)': 'handleEscapeKey()'
  },
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly mobileNavOpen = signal(false)

  readonly navGroups = signal<NavGroup[]>([
    {
      heading: 'Featured',
      items: [
        {
          label: 'ChatGPT Coding Assistant',
          icon: 'heroCodeBracket',
          routerLink: '/ChatGPT/CodeAssistant'
        },
        {
          label: 'ChatGPT Writing Assistant',
          icon: 'heroPencilSquare',
          routerLink: '/ChatGPT/WritingAssistant'
        }
      ]
    },
    {
      heading: 'Testing',
      items: [
        {
          label: 'Azure Latency Test',
          icon: 'heroBolt',
          routerLink: '/Azure/Latency'
        },
        {
          label: 'Region to Region Latency',
          icon: 'heroArrowsRightLeft',
          routerLink: '/Azure/RegionToRegionLatency'
        },
        {
          label: 'PsPing Network Latency Test',
          icon: 'heroSignal',
          routerLink: '/Azure/PsPing'
        },
        {
          label: 'Download Speed Test',
          icon: 'heroArrowDownTray',
          routerLink: '/Azure/Download'
        },
        {
          label: 'Upload Speed Test',
          icon: 'heroArrowUpTray',
          routerLink: '/Azure/Upload'
        },
        {
          label: 'Large File Upload Speed Test',
          icon: 'heroArrowUpOnSquareStack',
          routerLink: '/Azure/UploadLargeFile'
        }
      ]
    },
    {
      heading: 'Resources',
      items: [
        {
          label: 'Azure Regions',
          icon: 'heroGlobeAmericas',
          routerLink: '/Information/AzureRegions'
        },
        {
          label: 'Azure Availability Zones',
          icon: 'heroServerStack',
          routerLink: '/Information/AzureAvailabilityZones'
        },
        {
          label: 'Azure Geographies',
          icon: 'heroGlobeAlt',
          routerLink: '/Information/AzureGeographies'
        },
        {
          label: 'Azure Sovereign Clouds',
          icon: 'heroCloud',
          routerLink: '/Information/AzureSovereignClouds'
        },
        {
          label: 'Azure Environments',
          icon: 'heroCog6Tooth',
          routerLink: '/Information/AzureEnvironments'
        }
      ]
    },
    {
      heading: 'IP Tools',
      items: [
        {
          label: 'Azure IP Lookup',
          icon: 'heroMagnifyingGlassCircle',
          routerLink: '/Azure/IPLookup'
        },
        {
          label: 'Azure IP Ranges',
          icon: 'heroMap',
          routerLink: '/Information/AzureIpRanges/AzureCloud'
        },
        {
          label: 'Azure IP Ranges By Region',
          icon: 'heroMapPin',
          routerLink: '/Information/AzureIpRangesByRegion'
        },
        {
          label: 'Azure IP Ranges By Service',
          icon: 'heroChartBar',
          routerLink: '/Information/AzureIpRangesByService'
        }
      ]
    },
    {
      heading: 'Info',
      items: [
        {
          label: 'About',
          icon: 'heroInformationCircle',
          routerLink: '/Azure/About'
        },
        {
          label: 'Privacy Policy',
          icon: 'heroShieldCheck',
          routerLink: '/Privacy'
        }
      ]
    }
  ])

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
