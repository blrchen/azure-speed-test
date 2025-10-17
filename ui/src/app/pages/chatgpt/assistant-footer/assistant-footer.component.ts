import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'app-assistant-footer',
  standalone: true,
  template: `
    <h2 class="content-heading">Disclaimers</h2>
    <ul>
      <li>
        Your data is secure with us. We do not store or share your data. All data processing is
        executed by Azure OpenAI. Using this assistant means you agree to Microsoft Azure OpenAI's
        privacy policy. More details can be found at
        <a
          href="https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy#what-data-does-the-azure-openai-service-process"
        >
          data, privacy, and security.
        </a>
      </li>
      <li>
        This Assistant uses the GPT Model provided by Azure OpenAI. Please be aware that responses
        may occasionally be inaccurate.
      </li>
    </ul>
    <h2 class="content-heading">Additional Information</h2>
    <ul>
      <li>
        If you're interested in learning how to build a chatbot application with ChatGPT, please
        visit
        <a href="https://github.com/blrchen/chatgpt-lite" target="_blank">ChatGPT Lite</a>
        and
        <a href="https://github.com/blrchen/chatgpt-minimal" target="_blank">ChatGPT Minimal</a>
        for more information and guidance.
      </li>
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssistantFooterComponent {}
