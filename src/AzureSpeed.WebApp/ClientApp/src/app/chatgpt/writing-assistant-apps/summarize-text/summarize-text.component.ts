import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { APIService } from '../../../services'
import { SystemPrompts } from '../../system-prompts'

@Component({
  selector: 'app-text-summarizer',
  templateUrl: './summarize-text.component.html'
})
export class SummarizeTextComponent implements OnInit {
  systemPromptId = SystemPrompts.SUMMARIZE_TEXT
  userContentForm: FormGroup
  isLoading = false
  result: string | null = null
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
      userContent: ['', [Validators.required, Validators.maxLength(5000)]]
    })
  }

  async submitForm(): Promise<void> {
    if (this.userContentForm.invalid) {
      return
    }
    this.isLoading = true
    this.result = null
    this.errorMessage = null
    const { userContent } = this.userContentForm.value
    const payload = {
      systemPromptId: this.systemPromptId,
      userContent
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
}
