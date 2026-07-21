import { CanDeactivateFn } from '@angular/router'

import type { UploadLargeFileComponent } from './upload-large-file.component'

export const confirmLargeFileUploadNavigation: CanDeactivateFn<UploadLargeFileComponent> = (
  component
) => component.canDeactivate()
