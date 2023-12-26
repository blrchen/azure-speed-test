import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { APIService } from '../../../services'
import { SystemPrompts } from '../../system-prompts'

@Component({
  selector: 'app-generate-code',
  templateUrl: './generate-code.component.html'
})
export class GenerateCodeComponent implements OnInit {
  private readonly localStorageKey = 'selectedProgramLanguage'
  systemPromptId = SystemPrompts.GENERATE_CODE
  userContentForm: FormGroup
  isLoading = false
  result: string | null = null
  languages = ['Python', 'Java', 'C#', 'JavaScript', 'TypeScript', 'C++', 'PHP', 'Kotlin']
  errorMessage: string | null = null

  constructor(
    private formBuilder: FormBuilder,
    private apiService: APIService
  ) {}

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
      systemPromptId: this.systemPromptId,
      userContent,
      programLanguage
    }

    try {
      const data = await this.apiService.getTextCompletion(payload)
      this.result = data?.choices[0]?.message?.content ?? null
    } catch (error) {
      this.errorMessage = error?.response?.data?.message || 'An unexpected error occurred'
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
