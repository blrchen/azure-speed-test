import { Routes } from '@angular/router'

export const CHATGPT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./chatgpt.component').then((_) => _.ChatGPTComponent),
    children: [
      {
        path: 'CodeAssistant',
        loadComponent: () =>
          import('./code-assistant/code-assistant.component').then((_) => _.CodeAssistantComponent)
      },
      {
        path: 'WritingAssistant',
        loadComponent: () =>
          import('./writing-assistant/writing-assistant.component').then(
            (_) => _.WritingAssistantComponent
          )
      },
      // Code Assistant
      {
        path: 'TranslateText',
        loadComponent: () =>
          import('./writing-assistant-apps/translate-text/translate-text.component').then(
            (_) => _.TranslateTextComponent
          )
      },
      {
        path: 'PolishText',
        loadComponent: () =>
          import('./writing-assistant-apps/polish-text/polish-text.component').then(
            (_) => _.PolishTextComponent
          )
      },
      {
        path: 'SummarizeText',
        loadComponent: () =>
          import('./writing-assistant-apps/summarize-text/summarize-text.component').then(
            (_) => _.SummarizeTextComponent
          )
      },
      {
        path: 'GenerateEmail',
        loadComponent: () =>
          import('./writing-assistant-apps/generate-email/generate-email.component').then(
            (_) => _.GenerateEmailComponent
          )
      },
      // Writing Assistant
      {
        path: 'ExplainCode',
        loadComponent: () =>
          import('./code-assistant-apps/explain-code/explain-code.component').then(
            (_) => _.ExplainCodeComponent
          )
      },
      {
        path: 'GenerateCode',
        loadComponent: () =>
          import('./code-assistant-apps/generate-code/generate-code.component').then(
            (_) => _.GenerateCodeComponent
          )
      },
      {
        path: 'ConvertToBash',
        loadComponent: () =>
          import('./code-assistant-apps/convert-to-bash/convert-to-bash.component').then(
            (_) => _.ConvertToBashComponent
          )
      },
      {
        path: '**',
        redirectTo: 'Latency',
        pathMatch: 'full'
      }
    ]
  }
]
