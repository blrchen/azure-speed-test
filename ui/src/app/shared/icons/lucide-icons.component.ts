import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation
} from '@angular/core'
import {
  Activity,
  AlertCircle,
  ArrowLeftRight,
  BarChart3,
  Braces,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Cloud,
  Code,
  Cog,
  Copy,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Github,
  Globe,
  Globe2,
  Info,
  Languages,
  Lightbulb,
  Lock,
  LucideAngularModule,
  Mail,
  Map,
  MapPin,
  Menu,
  Moon,
  Network,
  Pencil,
  Search,
  SearchX,
  Server,
  Share2,
  ShieldCheck,
  SignalHigh,
  Sparkles,
  Sun,
  Tag,
  Terminal,
  Unlock,
  Upload,
  UploadCloud,
  X,
  Zap
} from 'lucide-angular'

const ICON_MAP = {
  activity: Activity,
  'alert-circle': AlertCircle,
  'arrow-left-right': ArrowLeftRight,
  'bar-chart-3': BarChart3,
  braces: Braces,
  'building-2': Building2,
  check: Check,
  'check-circle': CheckCircle,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  cloud: Cloud,
  code: Code,
  cog: Cog,
  copy: Copy,
  download: Download,
  'external-link': ExternalLink,
  'file-check': FileCheck,
  'file-text': FileText,
  github: Github,
  globe: Globe,
  'globe-2': Globe2,
  info: Info,
  languages: Languages,
  lightbulb: Lightbulb,
  lock: Lock,
  mail: Mail,
  map: Map,
  'map-pin': MapPin,
  menu: Menu,
  moon: Moon,
  network: Network,
  pencil: Pencil,
  search: Search,
  'search-x': SearchX,
  server: Server,
  'share-2': Share2,
  'shield-check': ShieldCheck,
  'signal-high': SignalHigh,
  sparkles: Sparkles,
  sun: Sun,
  tag: Tag,
  terminal: Terminal,
  unlock: Unlock,
  upload: Upload,
  'upload-cloud': UploadCloud,
  x: X,
  zap: Zap
} as const

export type LucideIconName = keyof typeof ICON_MAP

@Component({
  selector: 'app-lucide-icon',
  imports: [LucideAngularModule],
  template: `
    <lucide-icon
      [img]="iconClass()"
      [strokeWidth]="strokeWidth()"
      [absoluteStrokeWidth]="absoluteStrokeWidth()"
    />
  `,
  styles: [
    `
      app-lucide-icon {
        display: inline-flex;
        line-height: 0;
      }
      app-lucide-icon svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    `
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LucideIconComponent {
  readonly name = input.required<LucideIconName>()
  readonly strokeWidth = input(1.5)
  readonly absoluteStrokeWidth = input(false)

  readonly iconClass = computed(() => ICON_MAP[this.name()])
}
