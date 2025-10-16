import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'app-not-found',
  template: '<h1 class="page-title">404 page</h1>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {}
