import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { APIService } from '../../../services'
import { SystemPrompts } from '../../system-prompts'

@Component({
  selector: 'app-text-translator',
  templateUrl: './translate-text.component.html'
})
export class TranslateTextComponent implements OnInit {
  private readonly localStorageKey = 'selectedResponseLanguage'
  systemPromptId = SystemPrompts.TRANSLATE_TEXT
  userContentForm: FormGroup
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
      systemPromptId: this.systemPromptId,
      userContent,
      responseLanguage
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

  onResponseLanguageChange(lang: string): void {
    this.saveLanguage(lang)
  }

  private saveLanguage(lang: string): void {
    localStorage.setItem(this.localStorageKey, lang)
  }

  private getSavedLanguage(): string {
    return localStorage.getItem(this.localStorageKey) || 'English'
  }
}
