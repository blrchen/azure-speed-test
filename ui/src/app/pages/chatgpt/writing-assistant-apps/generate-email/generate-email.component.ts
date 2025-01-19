import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import axios, { AxiosError } from 'axios'
import { AssistantResponse } from '../../../../models'
import { chatGPTConfig } from '../../chatgpt.config'
import { SystemPrompts } from '../../system-prompts'
import { environment } from '../../../../../environments/environment'
import { SeoService } from '../../../../services'

@Component({
  selector: 'app-generate-email',
  templateUrl: './generate-email.component.html'
})
export class GenerateEmailComponent implements OnInit {
  systemPromptId = SystemPrompts.GENERATE_EMAIL
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
    this.seoService.setMetaTitle('ChatGPT Email Generator')
    this.seoService.setMetaDescription(
      "Generate medium to long-sized emails quickly with ChatGPT's Email Generator. Simply enter your desired email subject and let our tool do the rest."
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/GenerateEmail')
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

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here if you have a notification service
      console.log('Email copied to clipboard')
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  resetForm(): void {
    location.reload()
  }
}
