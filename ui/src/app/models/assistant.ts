export interface AssistantResponse {
  id: string
  created: number
  model: string
  choices: Choice[]
  usage: {
    completionTokens: number
    promptTokens: number
    totalTokens: number
  }
}

interface Choice {
  index: number
  finishReason: string
  message: {
    role: string
    content: string
  }
}
