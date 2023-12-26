import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { CodeAssistantComponent } from './code-assistant'
import {
  ConvertToBashComponent,
  ExplainCodeComponent,
  GenerateCodeComponent
} from './code-assistant-apps'
import {
  GenerateEmailComponent,
  PolishTextComponent,
  SummarizeTextComponent,
  TranslateTextComponent
} from './writing-assistant-apps'

import { ChatGPTComponent } from '.'
import { WritingAssistantComponent } from './writing-assistant'

const routes: Routes = [
  {
    path: '',
    component: ChatGPTComponent,
    children: [
      {
        path: 'CodeAssistant',
        component: CodeAssistantComponent,
        data: { title: 'ChatGPT Code Assistant' }
      },
      {
        path: 'WritingAssistant',
        component: WritingAssistantComponent,
        data: { title: 'ChatGPT Writing  Assistant' }
      },
      // Code Assistant
      {
        path: 'TranslateText',
        component: TranslateTextComponent,
        data: { title: 'ChatGPT Text Translator' }
      },
      {
        path: 'PolishText',
        component: PolishTextComponent,
        data: { title: 'ChatGPT Text Polisher' }
      },
      {
        path: 'SummarizeText',
        component: SummarizeTextComponent,
        data: { title: 'ChatGPT Text Summarizer' }
      },
      {
        path: 'GenerateEmail',
        component: GenerateEmailComponent,
        data: { title: 'ChatGPT Email Generator' }
      },
      // Writing Assistant
      {
        path: 'ExplainCode',
        component: ExplainCodeComponent,
        data: { title: 'ChatGPT Code Explainer' }
      },
      {
        path: 'GenerateCode',
        component: GenerateCodeComponent,
        data: { title: 'ChatGPT Code Generator' }
      },
      {
        path: 'ConvertToBash',
        component: ConvertToBashComponent,
        data: { title: 'ChatGPT Shell Command Generator' }
      },
      {
        path: '**',
        redirectTo: 'Latency',
        pathMatch: 'full'
      }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatGPTRoutingModule {}
