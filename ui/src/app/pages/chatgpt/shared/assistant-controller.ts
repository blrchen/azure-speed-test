import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { computed, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import { AssistantResponse } from '../../../models'
import { API_ENDPOINT } from '../../../shared/constants'
import { createCopyToClipboard } from '../../../shared/utils'
import { chatGPTConfig } from '../chatgpt.config'

export interface AssistantController<TPayload> {
  readonly isLoading: ReturnType<typeof signal<boolean>>
  readonly result: ReturnType<typeof signal<string | null>>
  readonly errorMessage: ReturnType<typeof signal<string | null>>
  readonly copyStatus: ReturnType<typeof signal<'idle' | 'copied' | 'failed'>>
  readonly isCopyIdle: ReturnType<typeof computed>
  readonly isCopySuccess: ReturnType<typeof computed>
  readonly isCopyError: ReturnType<typeof computed>
  submit(payload: TPayload): Promise<void>
  copy(text: string | null | undefined): Promise<void>
  reset(): void
  destroy(): void
}

export const createAssistantController = <TFormValue>(
  http: HttpClient,
  options: {
    systemPromptId: string
    buildPayload: (formValue: TFormValue) => Record<string, unknown>
  }
): AssistantController<TFormValue> => {
  const isLoading = signal(false)
  const result = signal<string | null>(null)
  const errorMessage = signal<string | null>(null)
  const clipboard = createCopyToClipboard()

  const submit = async (formValue: TFormValue): Promise<void> => {
    isLoading.set(true)
    result.set(null)
    errorMessage.set(null)
    clipboard.setStatus('idle')

    const payload = {
      accessToken: chatGPTConfig.accessToken,
      systemPromptId: options.systemPromptId,
      ...options.buildPayload(formValue)
    }

    try {
      const response = await firstValueFrom(
        http.post<AssistantResponse>(`${API_ENDPOINT}/api/10-free-calls-per-ip-each-day`, payload)
      )
      result.set(response?.choices[0]?.message?.content ?? null)
    } catch (error) {
      let message = 'An unexpected error occurred'
      if (error instanceof HttpErrorResponse) {
        const errorPayload = error.error as { message?: string } | undefined
        message =
          errorPayload?.message ?? (typeof error.error === 'string' ? error.error : error.message)
      } else if (error instanceof Error) {
        message = error.message
      }
      errorMessage.set(message)
    } finally {
      isLoading.set(false)
    }
  }

  const copy = async (text: string | null | undefined): Promise<void> => {
    await clipboard.copyText(text ?? '')
  }

  const reset = (): void => {
    isLoading.set(false)
    result.set(null)
    errorMessage.set(null)
    clipboard.setStatus('idle')
  }

  const destroy = (): void => {
    clipboard.destroy()
  }

  return {
    isLoading,
    result,
    errorMessage,
    copyStatus: clipboard.copyStatus,
    isCopyIdle: clipboard.isCopyIdle,
    isCopySuccess: clipboard.isCopySuccess,
    isCopyError: clipboard.isCopyError,
    submit,
    copy,
    reset,
    destroy
  }
}
