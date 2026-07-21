import { Component, computed, input } from '@angular/core'
import {
  LucideActivity,
  LucideAlertCircle,
  LucideArrowLeftRight,
  LucideBarChart3,
  LucideBraces,
  LucideBuilding2,
  LucideCheck,
  LucideCheckCircle,
  LucideChevronDown,
  LucideChevronRight,
  LucideCloud,
  LucideCode,
  LucideCog,
  LucideCopy,
  LucideDatabase,
  LucideDownload,
  LucideDynamicIcon,
  LucideExternalLink,
  LucideFileCheck,
  LucideFileText,
  LucideGlobe,
  LucideGlobe2,
  LucideInfo,
  LucideLanguages,
  LucideLightbulb,
  LucideLoaderCircle,
  LucideLock,
  LucideMail,
  LucideMap,
  LucideMapPin,
  LucideMenu,
  LucideMoon,
  LucideNetwork,
  LucidePencil,
  LucideSearch,
  LucideSearchX,
  LucideServer,
  LucideShare2,
  LucideShieldCheck,
  LucideSignalHigh,
  LucideSparkles,
  LucideSun,
  LucideTag,
  LucideTerminal,
  LucideUnlock,
  LucideUpload,
  LucideUploadCloud,
  LucideX,
  LucideZap,
  type LucideIconData,
} from '@lucide/angular'

const GITHUB_ICON = {
  name: 'github',
  node: [
    [
      'path',
      {
        d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
        key: 'tonef',
      },
    ],
    ['path', { d: 'M9 18c-4.51 2-5-2-7-2', key: '9comsn' }],
  ],
} satisfies LucideIconData

const ICON_MAP = {
  activity: LucideActivity,
  'alert-circle': LucideAlertCircle,
  'arrow-left-right': LucideArrowLeftRight,
  'bar-chart-3': LucideBarChart3,
  braces: LucideBraces,
  'building-2': LucideBuilding2,
  check: LucideCheck,
  'check-circle': LucideCheckCircle,
  'chevron-down': LucideChevronDown,
  'chevron-right': LucideChevronRight,
  cloud: LucideCloud,
  code: LucideCode,
  cog: LucideCog,
  copy: LucideCopy,
  database: LucideDatabase,
  download: LucideDownload,
  'external-link': LucideExternalLink,
  'file-check': LucideFileCheck,
  'file-text': LucideFileText,
  github: GITHUB_ICON,
  globe: LucideGlobe,
  'globe-2': LucideGlobe2,
  info: LucideInfo,
  languages: LucideLanguages,
  lightbulb: LucideLightbulb,
  'loader-circle': LucideLoaderCircle,
  lock: LucideLock,
  mail: LucideMail,
  map: LucideMap,
  'map-pin': LucideMapPin,
  menu: LucideMenu,
  moon: LucideMoon,
  network: LucideNetwork,
  pencil: LucidePencil,
  search: LucideSearch,
  'search-x': LucideSearchX,
  server: LucideServer,
  'share-2': LucideShare2,
  'shield-check': LucideShieldCheck,
  'signal-high': LucideSignalHigh,
  sparkles: LucideSparkles,
  sun: LucideSun,
  tag: LucideTag,
  terminal: LucideTerminal,
  unlock: LucideUnlock,
  upload: LucideUpload,
  'upload-cloud': LucideUploadCloud,
  x: LucideX,
  zap: LucideZap,
} as const

export type LucideIconName = keyof typeof ICON_MAP

@Component({
  selector: 'app-lucide-icon',
  imports: [LucideDynamicIcon],
  template: `
    <svg
      [lucideIcon]="iconClass()"
      [strokeWidth]="strokeWidth()"
      [absoluteStrokeWidth]="absoluteStrokeWidth()"
    ></svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
      }
      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class LucideIconComponent {
  readonly name = input.required<LucideIconName>()
  readonly strokeWidth = input(1.5)
  readonly absoluteStrokeWidth = input(false)

  readonly iconClass = computed(() => ICON_MAP[this.name()])
}
