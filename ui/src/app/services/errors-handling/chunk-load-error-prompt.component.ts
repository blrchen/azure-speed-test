import { DOCUMENT } from '@angular/common'
import { Component, inject } from '@angular/core'

import { ChunkLoadErrorPromptStore } from './chunk-load-error-prompt.store'

@Component({
  selector: 'app-chunk-load-error-prompt',
  host: {
    class: 'contents',
  },
  template: `
    @if (prompt.visible()) {
      <aside id="app-chunk-load-error-prompt" role="status" aria-live="polite" aria-atomic="true">
        <div class="prompt-title">A new version is available</div>
        <p>This page is using an older cached file. Reload to get the latest version.</p>
        <div class="prompt-actions">
          <button type="button" class="btn btn-primary" (click)="reload()">Reload</button>
        </div>
      </aside>
    }
  `,
  styles: `
    aside {
      position: fixed;
      right: max(1rem, env(safe-area-inset-right));
      bottom: max(1rem, env(safe-area-inset-bottom));
      z-index: 1000;
      display: flex;
      width: min(28rem, calc(100vw - 2rem));
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      color: var(--color-text-body);
      background-color: var(--color-surface-raised);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
    }

    .prompt-title {
      color: var(--color-text-strong);
      font-weight: 700;
    }

    p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.45;
    }

    .prompt-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: flex-end;
    }
  `,
})
export class ChunkLoadErrorPromptComponent {
  private readonly document = inject(DOCUMENT)

  protected readonly prompt = inject(ChunkLoadErrorPromptStore)

  protected reload(): void {
    this.document.location.reload()
  }
}
