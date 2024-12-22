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

import { ChatGPTComponent } from './index'
import { WritingAssistantComponent } from './writing-assistant'

const routes: Routes = [
  {
    path: '',
    component: ChatGPTComponent,
    children: [
      {
        path: 'CodeAssistant',
        component: CodeAssistantComponent
      },
      {
        path: 'WritingAssistant',
        component: WritingAssistantComponent
      },
      // Code Assistant
      {
        path: 'TranslateText',
        component: TranslateTextComponent
      },
      {
        path: 'PolishText',
        component: PolishTextComponent
      },
      {
        path: 'SummarizeText',
        component: SummarizeTextComponent
      },
      {
        path: 'GenerateEmail',
        component: GenerateEmailComponent
      },
      // Writing Assistant
      {
        path: 'ExplainCode',
        component: ExplainCodeComponent
      },
      {
        path: 'GenerateCode',
        component: GenerateCodeComponent
      },
      {
        path: 'ConvertToBash',
        component: ConvertToBashComponent
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
