import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'

import { LucideIconComponent } from '../icons/lucide-icons.component'

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LucideIconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  readonly startYear = 2013
}
