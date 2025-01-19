import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import axios, { AxiosError } from 'axios'
import { AssistantResponse } from '../../../../models'
import { chatGPTConfig } from '../../chatgpt.config'
import { SystemPrompts } from '../../system-prompts'
import { environment } from '../../../../../environments/environment'
import { SeoService } from '../../../../services'

@Component({
  selector: 'app-text-translator',
  templateUrl: './translate-text.component.html'
})
export class TranslateTextComponent implements OnInit {
  systemPromptId = SystemPrompts.TRANSLATE_TEXT
  userContentForm!: FormGroup
  isLoading = false
  result: string | null = null
  languages = [
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
  ]
  errorMessage: string | null = null
  private readonly localStorageKey = 'selectedResponseLanguage'

  constructor(
    private formBuilder: FormBuilder,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.initializeSeoProperties()
  }

  ngOnInit(): void {
    this.initializeForm()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('ChatGPT Text Translator - Translate Text Instantly')
    this.seoService.setMetaDescription(
      'Use our ChatGPT-powered text translator to instantly translate text into over 20 languages.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/TranslateText')
  }

  initializeForm(): void {
    this.userContentForm = this.formBuilder.group({
      userContent: ['', [Validators.required, Validators.maxLength(5000)]],
      responseLanguage: [this.getSavedLanguage(), Validators.required]
    })
  }

  async submitForm(): Promise<void> {
    if (this.userContentForm.invalid) {
      return
    }
    this.isLoading = true
    this.result = null
    this.errorMessage = null
    const { userContent, responseLanguage } = this.userContentForm.value
    const payload = {
      accessToken: chatGPTConfig.accessToken,
      systemPromptId: this.systemPromptId,
      userContent,
      responseLanguage
    }

    try {
      const response = await axios.post<AssistantResponse>(
        `${environment.apiEndpoint}/api/free-for-10-calls-per-ip-each-day`,
        payload
      )
      this.result = response.data?.choices[0]?.message?.content ?? null
    } catch (error) {
      let message = 'An unexpected error occurred'
      if (error instanceof AxiosError) {
        message = error.response?.data?.message
      } else if (error instanceof Error) {
        message = error.message
      }
      this.errorMessage = message
    } finally {
      this.isLoading = false
    }
  }

  resetForm(): void {
    location.reload()
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
