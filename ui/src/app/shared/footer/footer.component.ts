import { Component } from '@angular/core'

import { LucideIconComponent } from '../icons/lucide-icons.component'

@Component({
  selector: 'app-footer',
  imports: [LucideIconComponent],
  templateUrl: './footer.component.html',
  host: { class: 'block' },
})
export class FooterComponent {}
