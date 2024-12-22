import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import axios, { AxiosError } from 'axios'
import { AssistantResponse } from '../../../../models'
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
    private seoService: SeoService
  ) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('ChatGPT Code Generator - Generate Code with AI')
    this.seoService.setMetaDescription(
      'Welcome to ChatGPT Code Generator. This tool uses AI technology to generate code based on your natural language descriptions.'
    )
    this.seoService.setMetaKeywords(
      'ChatGPT, Code Generator, AI, Code, Programming, Python, Java, C#, JavaScript, TypeScript, C++, PHP'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/GenerateCode')
  }

  ngOnInit(): void {
    this.initializeForm()
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
      accessToken: '241201tc-a314-4c51-9437-cc84416b4aa4',
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
    localStorage.setItem(this.localStorageKey, lang)
  }

  private getSavedLanguage(): string {
    return localStorage.getItem(this.localStorageKey) || 'C#'
  }
}
