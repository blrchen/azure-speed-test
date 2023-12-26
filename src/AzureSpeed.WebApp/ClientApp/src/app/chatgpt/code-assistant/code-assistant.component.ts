import { Component, OnInit } from '@angular/core'

interface Card {
  title: string
  text: string
  link: string
}

@Component({
  selector: 'app-code-list',
  templateUrl: './code-assistant.component.html'
})
export class CodeAssistantComponent implements OnInit {
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

  ngOnInit() {}
}
