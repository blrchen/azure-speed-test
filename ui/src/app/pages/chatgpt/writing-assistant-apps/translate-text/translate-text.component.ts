import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { startWith } from 'rxjs'

import { SeoService } from '../../../../services'
import { LucideIconComponent } from '../../../../shared/icons/lucide-icons.component'
import { AssistantFooterComponent } from '../../assistant-footer/assistant-footer.component'
import { createAssistantController } from '../../shared/assistant-controller'
import { SystemPrompts } from '../../system-prompts'

@Component({
  selector: 'app-text-translator',
  imports: [ReactiveFormsModule, AssistantFooterComponent, LucideIconComponent],
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
  private readonly assistant = createAssistantController<{
    userContent: string
    responseLanguage: string
  }>(this.http, {
    systemPromptId: this.systemPromptId,
    buildPayload: (formValue) => ({
      userContent: formValue.userContent,
      responseLanguage: formValue.responseLanguage
    })
  })
  readonly isLoading = this.assistant.isLoading
  readonly result = this.assistant.result
  readonly errorMessage = this.assistant.errorMessage
  readonly copyStatus = this.assistant.copyStatus
  readonly hasResult = computed(() => this.result() !== null)
  readonly isCopyIdle = this.assistant.isCopyIdle
  readonly isCopySuccess = this.assistant.isCopySuccess
  readonly isCopyError = this.assistant.isCopyError
  private readonly userContentValue = toSignal(
    this.userContentForm.controls.userContent.valueChanges.pipe(
      startWith(this.userContentForm.controls.userContent.value)
    ),
    { initialValue: this.userContentForm.controls.userContent.value }
  )
  readonly userContentLength = computed(() => this.userContentValue()?.length ?? 0)

  private readonly localStorageKey = 'selectedResponseLanguage'

  ngOnInit(): void {
    this.seoService.setMetaTitle('ChatGPT Text Translator - Translate Text Instantly')
    this.seoService.setMetaDescription(
      'Use our ChatGPT-powered text translator to instantly translate text into over 20 languages.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/TranslateText')
    this.destroyRef.onDestroy(() => this.assistant.destroy())
  }

  async submitForm(): Promise<void> {
    if (this.userContentForm.invalid) {
      return
    }

    await this.assistant.submit(this.userContentForm.getRawValue())
  }

  async copyToClipboard(text: string | null | undefined): Promise<void> {
    await this.assistant.copy(text)
  }

  resetForm(): void {
    this.userContentForm.reset({
      userContent: '',
      responseLanguage: this.getSavedLanguage()
    })
    this.assistant.reset()
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
}
