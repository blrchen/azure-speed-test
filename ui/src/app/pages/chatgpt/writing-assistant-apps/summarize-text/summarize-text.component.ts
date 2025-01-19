import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import axios, { AxiosError } from 'axios'
import { AssistantResponse } from '../../../../models'
import { SystemPrompts } from '../../system-prompts'
import { environment } from '../../../../../environments/environment'
import { SeoService } from '../../../../services'
import { chatGPTConfig } from '../../chatgpt.config'

@Component({
  selector: 'app-text-summarizer',
  templateUrl: './summarize-text.component.html'
})
export class SummarizeTextComponent implements OnInit {
  systemPromptId = SystemPrompts.SUMMARIZE_TEXT
  userContentForm!: FormGroup
  isLoading = false
  result: string | null = null
  errorMessage: string | null = null

  constructor(
    private formBuilder: FormBuilder,
    private seoService: SeoService
  ) {
    this.initializeSeoProperties()
  }

  ngOnInit(): void {
    this.initializeForm()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle(
      'ChatGPT Text Summarizer - Enhance Productivity with AI-Powered Summaries'
    )
    this.seoService.setMetaDescription(
      'Enhance your productivity with our advanced text summarizer, powered by ChatGPT. Convert your extensive articles or text into short, crisp summaries using this innovative tool.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/SummarizeText')
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
      accessToken: chatGPTConfig.accessToken,
      systemPromptId: this.systemPromptId,
      userContent
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
}
