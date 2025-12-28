import { isPlatformBrowser } from '@angular/common'
import {
  afterNextRender,
  DOCUMENT,
  effect,
  inject,
  Injectable,
  Injector,
  PLATFORM_ID,
  runInInjectionContext,
  signal,
  WritableSignal
} from '@angular/core'

import { ThemeMode } from '../models/theme'

const STORAGE_KEY_THEME = 'THEME'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly injector = inject(Injector)
  private readonly document = inject(DOCUMENT)
  private readonly platformId = inject(PLATFORM_ID)
  private initialized = false

  readonly themeMode: WritableSignal<ThemeMode> = signal<ThemeMode>('light')

  constructor() {
    afterNextRender(() => this.ensureInitialized())
  }

  private ensureInitialized(): void {
    if (this.initialized || !isPlatformBrowser(this.platformId)) {
      return
    }

    this.initialized = true
    this.initializeFromStorage()
    this.setupEffects()
  }

  private initializeFromStorage(): void {
    const storedTheme = localStorage.getItem(STORAGE_KEY_THEME)
    if (storedTheme === 'dark' || storedTheme === 'light') {
      this.themeMode.set(storedTheme)
    }
    this.applyTheme()
  }

  private setupEffects(): void {
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const mode = this.themeMode()
        localStorage.setItem(STORAGE_KEY_THEME, mode)
        this.applyTheme()
      })
    })
  }

  private applyTheme(): void {
    const html = this.document?.documentElement
    if (!html) {
      return
    }
    const mode = this.themeMode()
    if (mode === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  toggleTheme(): void {
    this.ensureInitialized()
    this.themeMode.update((current) => (current === 'dark' ? 'light' : 'dark'))
  }
}
