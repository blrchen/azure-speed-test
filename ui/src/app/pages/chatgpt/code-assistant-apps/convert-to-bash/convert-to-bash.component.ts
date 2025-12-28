import { HttpClient } from '@angular/common/http'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { startWith } from 'rxjs'

import { SeoService } from '../../../../services'
import { LucideIconComponent } from '../../../../shared/icons/lucide-icons.component'
import { AssistantFooterComponent } from '../../assistant-footer/assistant-footer.component'
import { createAssistantController } from '../../shared/assistant-controller'
import { SystemPrompts } from '../../system-prompts'

@Component({
  selector: 'app-convert-to-bash',
  imports: [ReactiveFormsModule, AssistantFooterComponent, LucideIconComponent],
  templateUrl: './convert-to-bash.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConvertToBashComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder)
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)
  private readonly destroyRef = inject(DestroyRef)

  readonly systemPromptId = SystemPrompts.CONVERT_TO_BASH
  readonly userContentForm = this.formBuilder.nonNullable.group({
    userContent: ['', [Validators.required, Validators.maxLength(5000)]]
  })
  private readonly assistant = createAssistantController<{ userContent: string }>(this.http, {
    systemPromptId: this.systemPromptId,
    buildPayload: (formValue) => ({ userContent: formValue.userContent })
  })
  readonly isLoading = this.assistant.isLoading
  readonly result = this.assistant.result
  readonly errorMessage = this.assistant.errorMessage
  readonly copyStatus = this.assistant.copyStatus
  readonly hasResult = computed(() => this.result() !== null)
  readonly isCopyIdle = this.assistant.isCopyIdle
  readonly isCopySuccess = this.assistant.isCopySuccess
  readonly isCopyError = this.assistant.isCopyError
  private readonly userContentValue = toSignal(
    this.userContentForm.controls.userContent.valueChanges.pipe(
      startWith(this.userContentForm.controls.userContent.value)
    ),
    { initialValue: this.userContentForm.controls.userContent.value }
  )
  readonly userContentLength = computed(() => this.userContentValue()?.length ?? 0)

  ngOnInit(): void {
    this.seoService.setMetaTitle('ChatGPT Shell Command Generator')
    this.seoService.setMetaDescription(
      'Use this tool to convert your code snippets into Bash scripts effortlessly.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/ConvertToBash')
    this.destroyRef.onDestroy(() => this.assistant.destroy())
  }

  async submitForm(): Promise<void> {
    if (this.userContentForm.invalid) {
      return
    }

    await this.assistant.submit(this.userContentForm.getRawValue())
  }

  async copyToClipboard(text: string | null | undefined): Promise<void> {
    await this.assistant.copy(text)
  }

  resetForm(): void {
    this.userContentForm.reset({ userContent: '' })
    this.assistant.reset()
  }
}
