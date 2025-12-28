import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'

import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-connection-details',
  imports: [LucideIconComponent],
  templateUrl: './connection-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectionDetailsComponent {
  readonly isVisible = input.required<boolean>()
  readonly isLoading = input.required<boolean>()
  readonly error = input.required<string | null>()
  readonly networkLabel = input.required<string | null>()
  readonly locationLabel = input.required<string | null>()
  readonly ipLabel = input.required<string | null>()

  readonly toggleVisibility = output<void>()
}
