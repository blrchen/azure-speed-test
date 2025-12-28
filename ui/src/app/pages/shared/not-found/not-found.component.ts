import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'app-not-found',
  template: '<h1 class="text-4xl font-bold text-text-strong">404 page</h1>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {}
