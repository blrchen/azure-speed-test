import { Component, inject } from '@angular/core'

import { RouteLoadingService } from './route-loading.service'

@Component({
  selector: 'app-route-loader',
  host: {
    class: 'contents',
  },
  templateUrl: './route-loader.component.html',
})
export class RouteLoaderComponent {
  readonly routeLoading = inject(RouteLoadingService)
}
