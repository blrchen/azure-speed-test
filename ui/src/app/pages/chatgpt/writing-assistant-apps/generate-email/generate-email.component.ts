import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { AssistantResponse } from '../../../../models'
import { chatGPTConfig } from '../../chatgpt.config'
import { SystemPrompts } from '../../system-prompts'
import { API_ENDPOINT } from '../../../../shared/constants'
import { SeoService } from '../../../../services'
import { AssistantFooterComponent } from '../../assistant-footer/assistant-footer.component'

@Component({
  selector: 'app-generate-email',
  standalone: true,
  imports: [ReactiveFormsModule, AssistantFooterComponent],
  templateUrl: './generate-email.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateEmailComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder)
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)
  private readonly destroyRef = inject(DestroyRef)

  readonly systemPromptId = SystemPrompts.GENERATE_EMAIL
  readonly userContentForm = this.formBuilder.nonNullable.group({
    userContent: ['', [Validators.required, Validators.maxLength(5000)]]
  })
  readonly isLoading = signal(false)
  readonly result = signal<string | null>(null)
  readonly errorMessage = signal<string | null>(null)
  readonly copyStatus = signal<'idle' | 'copied' | 'failed'>('idle')
  readonly hasResult = computed(() => this.result() !== null)
  readonly isCopyIdle = computed(() => this.copyStatus() === 'idle')
  readonly isCopySuccess = computed(() => this.copyStatus() === 'copied')
  readonly isCopyError = computed(() => this.copyStatus() === 'failed')

  private copyResetTimeoutId: number | null = null

  ngOnInit(): void {
    this.initializeSeoProperties()
    this.destroyRef.onDestroy(() => this.clearCopyStatusTimer())
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('ChatGPT Email Generator')
    this.seoService.setMetaDescription(
      "Generate medium to long-sized emails quickly with ChatGPT's Email Generator. Simply enter your desired email subject and let our tool do the rest."
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/GenerateEmail')
  }

  async submitForm(): Promise<void> {
    if (this.userContentForm.invalid) {
      return
    }

    this.isLoading.set(true)
    this.result.set(null)
    this.errorMessage.set(null)
    this.copyStatus.set('idle')
    this.clearCopyStatusTimer()

    const { userContent } = this.userContentForm.getRawValue()
    const payload = {
      accessToken: chatGPTConfig.accessToken,
      systemPromptId: this.systemPromptId,
      userContent
    }

    try {
      const response = await firstValueFrom(
        this.http.post<AssistantResponse>(
          `${API_ENDPOINT}/api/10-free-calls-per-ip-each-day`,
          payload
        )
      )
      this.result.set(response?.choices[0]?.message?.content ?? null)
    } catch (error) {
      let message = 'An unexpected error occurred'
      if (error instanceof HttpErrorResponse) {
        const errorPayload = error.error as { message?: string } | undefined
        message =
          errorPayload?.message ?? (typeof error.error === 'string' ? error.error : error.message)
      } else if (error instanceof Error) {
        message = error.message
      }
      this.errorMessage.set(message)
    } finally {
      this.isLoading.set(false)
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    if (!text) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      this.copyStatus.set('copied')
    } catch (err) {
      console.error('Failed to copy text: ', err)
      this.copyStatus.set('failed')
    }

    this.scheduleCopyStatusReset()
  }

  resetForm(): void {
    this.userContentForm.reset({ userContent: '' })
    this.result.set(null)
    this.errorMessage.set(null)
    this.copyStatus.set('idle')
    this.clearCopyStatusTimer()
    this.isLoading.set(false)
  }

  private scheduleCopyStatusReset(): void {
    this.clearCopyStatusTimer()
    this.copyResetTimeoutId = window.setTimeout(() => {
      this.copyResetTimeoutId = null
      this.copyStatus.set('idle')
    }, 3000)
  }

  private clearCopyStatusTimer(): void {
    if (this.copyResetTimeoutId !== null) {
      window.clearTimeout(this.copyResetTimeoutId)
      this.copyResetTimeoutId = null
    }
  }
}
