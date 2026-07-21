import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

import { LucideIconComponent } from '../icons/lucide-icons.component'

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LucideIconComponent],
  templateUrl: './footer.component.html',
  host: { class: 'block' },
})
export class FooterComponent {}
