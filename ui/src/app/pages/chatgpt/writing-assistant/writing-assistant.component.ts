import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { SeoService } from '../../../services'

interface Card {
  title: string
  text: string
  link: string
}

@Component({
  selector: 'app-writing-assistant',
  imports: [RouterLink],
  templateUrl: './writing-assistant.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WritingAssistantComponent implements OnInit {
  private readonly seoService = inject(SeoService)

  readonly textCards = signal<Card[]>([
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
  ])

  ngOnInit(): void {
    this.seoService.setMetaTitle('ChatGPT Writing Assistant')
    this.seoService.setMetaDescription(
      'Welcome to ChatGPT Writing Assistant, your companion for mastering the art of written communication. This AI-driven assistant is ideal for writers, students, professionals, and anyone passionate about crafting compelling narratives with ease and precision.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/ChatGPT/WritingAssistant')
  }
}
