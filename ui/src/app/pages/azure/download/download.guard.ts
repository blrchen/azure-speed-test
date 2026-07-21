import { CanDeactivateFn } from '@angular/router'

import type { DownloadComponent } from './download.component'

export const confirmDownloadSpeedTestNavigation: CanDeactivateFn<DownloadComponent> = (component) =>
  component.canDeactivate()
