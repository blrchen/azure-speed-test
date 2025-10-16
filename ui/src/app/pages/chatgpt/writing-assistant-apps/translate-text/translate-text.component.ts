import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal
} from '@angular/core'
import { CommonModule, isPlatformBrowser } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { AssistantResponse } from '../../../../models'
import { chatGPTConfig } from '../../chatgpt.config'
import { SystemPrompts } from '../../system-prompts'
import { API_ENDPOINT } from '../../../../shared/constants'
import { SeoService } from '../../../../services'
import { AssistantFooterComponent } from '../../assistant-footer/assistant-footer.component'

@Component({
  selector: 'app-text-translator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AssistantFooterComponent],
  templateUrl: './translate-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranslateTextComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder)
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly destroyRef = inject(DestroyRef)

  readonly systemPromptId = SystemPrompts.TRANSLATE_TEXT
  readonly languages = [
    'Arabic',
    'Chinese (Mandarin)',
    'Dutch',
    'English',
    'French',
    'German',
    'Greek',
    'Hebrew',
    'Hindi',
    'Indonesian',
    'Italian',
    'Japanese',
    'Korean',
    'Polish',
    'Portuguese',
    'Russian',
    'Spanish',
    'Swedish',
    'Thai',
    'Turkish'
  ] as const
  readonly userContentForm = this.formBuilder.nonNullable.group({
    userContent: ['', [Validators.required, Validators.maxLength(5000)]],
    responseLanguage: [this.getSavedLanguage(), Validators.required]
  })
  readonly isLoading = signal(false)
  readonly result = signal<string | null>(null)
  readonly errorMessage = signal<string | null>(null)
  readonly copyStatus = signal<'idle' | 'copied' | 'failed'>('idle')
  readonly hasResult = computed(() => this.result() !== null)
  readonly isCopyIdle = computed(() => this.copyStatus() === 'idle')
  readonly isCopySuccess = computed(() => this.copyStatus() === 'copied')
  readonly isCopyError = computed(() => this.copyStatus() === 'failed')

  private copyResetTimeoutId: number | null = null
  private readonly localStorageKey = 'selectedResponseLanguage'

  ngOnInit(): void {
    this.initializeSeoProperties()
    this.destroyRef.onDestroy(() => this.clearCopyStatusTimer())
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('ChatGPT Text Translator - Translate Text Instantly')
    this.seoService.setMetaDescription(
      'Use our ChatGPT-powered text translator to instantly translate text into over 20 languages.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/TranslateText')
  }

  async submitForm(): Promise<void> {
    if (this.userContentForm.invalid) {
      return
    }

    this.isLoading.set(true)
    this.result.set(null)
    this.errorMessage.set(null)
    this.copyStatus.set('idle')
    this.clearCopyStatusTimer()

    const { userContent, responseLanguage } = this.userContentForm.getRawValue()
    const payload = {
      accessToken: chatGPTConfig.accessToken,
      systemPromptId: this.systemPromptId,
      userContent,
      responseLanguage
    }

    try {
      const response = await firstValueFrom(
        this.http.post<AssistantResponse>(
          `${API_ENDPOINT}/api/10-free-calls-per-ip-each-day`,
          payload
        )
      )
      this.result.set(response?.choices[0]?.message?.content ?? null)
    } catch (error) {
      let message = 'An unexpected error occurred'
      if (error instanceof HttpErrorResponse) {
        const errorPayload = error.error as { message?: string } | undefined
        message =
          errorPayload?.message ?? (typeof error.error === 'string' ? error.error : error.message)
      } else if (error instanceof Error) {
        message = error.message
      }
      this.errorMessage.set(message)
    } finally {
      this.isLoading.set(false)
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    if (!text) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      this.copyStatus.set('copied')
    } catch (err) {
      console.error('Failed to copy text: ', err)
      this.copyStatus.set('failed')
    }

    this.scheduleCopyStatusReset()
  }

  resetForm(): void {
    this.userContentForm.reset({
      userContent: '',
      responseLanguage: this.getSavedLanguage()
    })
    this.result.set(null)
    this.errorMessage.set(null)
    this.copyStatus.set('idle')
    this.clearCopyStatusTimer()
    this.isLoading.set(false)
  }

  onResponseLanguageChange(lang: string): void {
    this.saveLanguage(lang)
  }

  private saveLanguage(lang: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.localStorageKey, lang)
    }
  }

  private getSavedLanguage(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.localStorageKey) || 'English'
    }
    return 'English' // Default value when not running in the browser
  }

  private scheduleCopyStatusReset(): void {
    this.clearCopyStatusTimer()
    this.copyResetTimeoutId = window.setTimeout(() => {
      this.copyResetTimeoutId = null
      this.copyStatus.set('idle')
    }, 3000)
  }

  private clearCopyStatusTimer(): void {
    if (this.copyResetTimeoutId !== null) {
      window.clearTimeout(this.copyResetTimeoutId)
      this.copyResetTimeoutId = null
    }
  }
}
