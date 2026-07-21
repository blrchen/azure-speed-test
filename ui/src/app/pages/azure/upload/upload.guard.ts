import { CanDeactivateFn } from '@angular/router'

import type { UploadComponent } from './upload.component'

export const confirmUploadSpeedTestNavigation: CanDeactivateFn<UploadComponent> = (component) =>
  component.canDeactivate()
