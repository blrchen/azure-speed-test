import { Service, signal } from '@angular/core'

@Service()
export class ChunkLoadErrorPromptStore {
  private readonly visibleState = signal(false)

  readonly visible = this.visibleState.asReadonly()

  show(): void {
    this.visibleState.set(true)
  }
}
