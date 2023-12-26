import { Component, OnInit } from '@angular/core'

interface Card {
  title: string
  text: string
  link: string
}

@Component({
  selector: 'app-code-list',
  templateUrl: './writing-assistant.component.html'
})
export class WritingAssistantComponent implements OnInit {
  textCards: Card[] = [
    {
      title: 'Text Translator',
      text: 'ChatGPT-powered Text Translator that instantly translates text into 20+ languages.',
      link: '/ChatGPT/TranslateText'
    },
    {
      title: 'Text Polisher',
      text: "ChatGPT's Text Polisher effortlessly enhances your writing.",
      link: '/ChatGPT/PolishText'
    },
    {
      title: 'Text Summarizer',
      text: 'Powered by ChatGPT, the Text Summarizer simplifies lengthy content into concise summaries within seconds.',
      link: '/ChatGPT/SummarizeText'
    },
    {
      title: 'Email Generator',
      text: "ChatGPT's Email Generator saves time by generating medium to long-sized emails for you.",
      link: '/ChatGPT/GenerateEmail'
    }
  ]
  ngOnInit() {}
}
