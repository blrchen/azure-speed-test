import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { SharedModule } from '../shared/shared.module'
import { ChatGPTRoutingModule } from './chatgpt-routing.module'
import { ChatGPTComponent } from './chatgpt.component'
import { CodeAssistantComponent } from './code-assistant'
import {
  GenerateEmailComponent,
  PolishTextComponent,
  SummarizeTextComponent,
  TranslateTextComponent
} from './writing-assistant-apps'
import {
  ConvertToBashComponent,
  ExplainCodeComponent,
  GenerateCodeComponent
} from './code-assistant-apps'
import { WritingAssistantComponent } from './writing-assistant'
import { AssistantFooterComponent } from './assistant-footer/assistant-footer.component'

@NgModule({
  bootstrap: [],
  declarations: [
    ChatGPTComponent,
    CodeAssistantComponent,
    WritingAssistantComponent,
    // Text,
    GenerateEmailComponent,
    PolishTextComponent,
    SummarizeTextComponent,
    TranslateTextComponent,
    // Code
    ExplainCodeComponent,
    GenerateCodeComponent,
    ConvertToBashComponent,
    AssistantFooterComponent
  ],
  exports: [],
  imports: [CommonModule, ChatGPTRoutingModule, SharedModule, ReactiveFormsModule],
  providers: []
})
export class ChatGPTModule {}
