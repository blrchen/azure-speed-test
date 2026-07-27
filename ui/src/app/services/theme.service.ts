import { isPlatformBrowser } from '@angular/common'
import {
  afterNextRender,
  DOCUMENT,
  effect,
  inject,
  Injector,
  PLATFORM_ID,
  Service,
  signal,
} from '@angular/core'

type ThemeMode = 'light' | 'dark'

const STORAGE_KEY_THEME_PREFERENCE = 'THEME_PREFERENCE'
const LIGHT_THEME_COLOR = '#ffffff'
const DARK_THEME_COLOR = '#171717'

/** Without a stored preference the site stays light; the OS setting is ignored. */
const DEFAULT_THEME_MODE: ThemeMode = 'light'

@Service()
export class ThemeService {
  private readonly injector = inject(Injector)
  private readonly document = inject(DOCUMENT)
  private readonly platformId = inject(PLATFORM_ID)
  private initialized = false

  private readonly themeModeState = signal<ThemeMode>(this.getInitialThemeMode())
  readonly themeMode = this.themeModeState.asReadonly()

  constructor() {
    afterNextRender(() => this.ensureInitialized())
  }

  private ensureInitialized(): void {
    if (this.initialized || !isPlatformBrowser(this.platformId)) return

    this.initialized = true
    this.initializeTheme()
    this.setupEffects()
  }

  private initializeTheme(): void {
    this.themeModeState.set(this.readStoredTheme() ?? DEFAULT_THEME_MODE)
    this.applyTheme()
  }

  private setupEffects(): void {
    effect(() => this.applyTheme(), { injector: this.injector })
  }

  private getInitialThemeMode(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) return DEFAULT_THEME_MODE

    return this.readStoredTheme() ?? DEFAULT_THEME_MODE
  }

  private readStoredTheme(): ThemeMode | null {
    try {
      const storedTheme = this.document.defaultView?.localStorage.getItem(
        STORAGE_KEY_THEME_PREFERENCE
      )
      return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : null
    } catch {
      return null
    }
  }

  private persistTheme(mode: ThemeMode): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY_THEME_PREFERENCE, mode)
    } catch {
      // localStorage can be unavailable; the DOM class still applies.
    }
  }

  private applyTheme(): void {
    const html = this.document.documentElement
    const isDark = this.themeMode() === 'dark'
    html.classList.toggle('dark', isDark)
    this.syncThemeColorMeta(isDark)
  }

  private syncThemeColorMeta(isDark: boolean): void {
    const head = this.document.head

    let themeColorMeta = this.document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!themeColorMeta) {
      themeColorMeta = this.document.createElement('meta')
      themeColorMeta.name = 'theme-color'
      head.appendChild(themeColorMeta)
    }

    themeColorMeta.content = isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR
  }

  toggleTheme(): void {
    this.ensureInitialized()

    const nextMode = this.themeMode() === 'dark' ? 'light' : 'dark'
    this.themeModeState.set(nextMode)
    this.persistTheme(nextMode)
  }
}
