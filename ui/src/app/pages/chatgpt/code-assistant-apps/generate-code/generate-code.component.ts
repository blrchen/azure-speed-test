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
  selector: 'app-generate-code',
  templateUrl: './generate-code.component.html'
})
export class GenerateCodeComponent implements OnInit {
  systemPromptId = SystemPrompts.GENERATE_CODE
  userContentForm!: FormGroup
  isLoading = false
  result: string | null = null
  languages = ['Python', 'Java', 'C#', 'JavaScript', 'TypeScript', 'C++', 'PHP']
  errorMessage: string | null = null
  private readonly localStorageKey = 'selectedProgramLanguage'

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
    this.seoService.setMetaTitle('ChatGPT Code Generator - Generate Code with AI')
    this.seoService.setMetaDescription(
      'Welcome to ChatGPT Code Generator. This tool uses AI technology to generate code based on your natural language descriptions.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/GenerateCode')
  }

  initializeForm(): void {
    this.userContentForm = this.formBuilder.group({
      userContent: ['', [Validators.required, Validators.maxLength(5000)]],
      programLanguage: [this.getSavedLanguage(), Validators.required]
    })
  }

  async submitForm(): Promise<void> {
    if (this.userContentForm.invalid) {
      return
    }
    this.isLoading = true
    this.result = null
    this.errorMessage = null
    const { userContent, programLanguage } = this.userContentForm.value
    const payload = {
      accessToken: chatGPTConfig.accessToken,
      systemPromptId: this.systemPromptId,
      userContent,
      programLanguage
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
