import { isPlatformBrowser } from '@angular/common'
import {
  afterNextRender,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  Injector,
  PLATFORM_ID,
  runInInjectionContext,
  Service,
  signal,
} from '@angular/core'

const STORAGE_KEY_THEME_PREFERENCE = 'THEME_PREFERENCE'
const LEGACY_STORAGE_KEY_THEME = 'THEME'
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)'
const LIGHT_THEME_COLOR = '#ffffff'
const DARK_THEME_COLOR = '#171717'

type ThemeMode = 'light' | 'dark'

@Service()
export class ThemeService {
  private readonly injector = inject(Injector)
  private readonly document = inject(DOCUMENT)
  private readonly platformId = inject(PLATFORM_ID)
  private initialized = false
  private systemThemeMediaQuery?: MediaQueryList

  private readonly themeModeState = signal<ThemeMode>(this.getInitialThemeMode())
  readonly themeMode = this.themeModeState.asReadonly()

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopFollowingSystemTheme())
    afterNextRender(() => this.ensureInitialized())
  }

  private ensureInitialized(): void {
    if (this.initialized || !isPlatformBrowser(this.platformId)) return

    this.initialized = true
    this.discardLegacyStoredTheme()
    this.initializeTheme()
    this.setupEffects()
  }

  private initializeTheme(): void {
    const storedTheme = this.readStoredTheme()
    this.themeModeState.set(storedTheme ?? this.getSystemThemeMode())

    if (!storedTheme) {
      this.startFollowingSystemTheme()
    }

    this.applyTheme()
  }

  private setupEffects(): void {
    runInInjectionContext(this.injector, () => {
      effect(() => this.applyTheme())
    })
  }

  private getInitialThemeMode(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) return 'light'

    const storedTheme = this.readStoredTheme()
    if (storedTheme) return storedTheme

    return this.getSystemThemeMode()
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

  private getSystemThemeMode(): ThemeMode {
    return this.document.defaultView?.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? 'dark' : 'light'
  }

  private startFollowingSystemTheme(): void {
    const mediaQuery = this.document.defaultView?.matchMedia(DARK_MODE_MEDIA_QUERY)
    if (!mediaQuery) return

    this.systemThemeMediaQuery = mediaQuery
    mediaQuery.addEventListener('change', this.handleSystemThemeChange)
  }

  private stopFollowingSystemTheme(): void {
    this.systemThemeMediaQuery?.removeEventListener('change', this.handleSystemThemeChange)
    this.systemThemeMediaQuery = undefined
  }

  private readonly handleSystemThemeChange = (event: MediaQueryListEvent): void => {
    this.themeModeState.set(event.matches ? 'dark' : 'light')
  }

  private discardLegacyStoredTheme(): void {
    try {
      this.document.defaultView?.localStorage.removeItem(LEGACY_STORAGE_KEY_THEME)
    } catch {
      // localStorage can be unavailable; the system preference still applies.
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
    this.stopFollowingSystemTheme()

    const nextMode = this.themeMode() === 'dark' ? 'light' : 'dark'
    this.themeModeState.set(nextMode)
    this.persistTheme(nextMode)
  }
}
