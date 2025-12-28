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
  selector: 'app-generate-code',
  imports: [ReactiveFormsModule, AssistantFooterComponent, LucideIconComponent],
  templateUrl: './generate-code.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateCodeComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder)
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly destroyRef = inject(DestroyRef)

  readonly systemPromptId = SystemPrompts.GENERATE_CODE
  readonly languages = ['Python', 'Java', 'C#', 'JavaScript', 'TypeScript', 'C++', 'PHP'] as const
  readonly userContentForm = this.formBuilder.nonNullable.group({
    userContent: ['', [Validators.required, Validators.maxLength(5000)]],
    programLanguage: [this.getSavedLanguage(), Validators.required]
  })
  private readonly assistant = createAssistantController<{
    userContent: string
    programLanguage: string
  }>(this.http, {
    systemPromptId: this.systemPromptId,
    buildPayload: (formValue) => ({
      userContent: formValue.userContent,
      programLanguage: formValue.programLanguage
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

  private readonly localStorageKey = 'selectedProgramLanguage'

  ngOnInit(): void {
    this.seoService.setMetaTitle('ChatGPT Code Generator - Generate Code with AI')
    this.seoService.setMetaDescription(
      'Welcome to ChatGPT Code Generator. This tool uses AI technology to generate code based on your natural language descriptions.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/GenerateCode')
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
      programLanguage: this.getSavedLanguage()
    })
    this.assistant.reset()
  }

  onProgramLanguageChange(lang: string): void {
    this.saveLanguage(lang)
  }

  private saveLanguage(lang: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.localStorageKey, lang)
    }
  }

  private getSavedLanguage(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.localStorageKey) || 'C#'
    }
    return 'C#' // Default value when not running in the browser
  }
}
