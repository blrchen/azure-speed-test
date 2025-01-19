import { Component } from '@angular/core'
import { SeoService } from '../../../services'

interface Card {
  title: string
  text: string
  link: string
}

@Component({
  selector: 'app-code-assistant',
  templateUrl: './code-assistant.component.html'
})
export class CodeAssistantComponent {
  codeCards: Card[] = [
    {
      title: 'Code Explainer',
      text: 'ChatGPT Code Explainer is an AI assistant designed to help users understand programming code.',
      link: '/ChatGPT/ExplainCode'
    },
    {
      title: 'Code Generator',
      text: 'ChatGPT Code Generator is an advanced AI-based tool that can generate code from natural language inputs.',
      link: '/ChatGPT/GenerateCode'
    },
    {
      title: 'Shell Command Generator',
      text: 'ChatGPT Shell Command generator converts natural language descriptions into shell command that can be executed.',
      link: '/ChatGPT/ConvertToBash'
    }
  ]

  constructor(private seoService: SeoService) {
    this.initializeSeoProperties()
  }

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('ChatGPT Coding Assistant')
    this.seoService.setMetaDescription(
      'Welcome to ChatGPT Coding Assistant, your AI tool for transforming coding. Perfect for developers and hobbyists to code with confidence.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/CodeAssistant')
  }
}
