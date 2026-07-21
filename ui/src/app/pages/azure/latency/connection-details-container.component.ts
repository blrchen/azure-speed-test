import { Component, inject } from '@angular/core'

import { CloudflareMetaStore } from './cloudflare-meta.store'
import { ConnectionDetailsComponent } from './connection-details.component'

@Component({
  selector: 'app-connection-details-container',
  imports: [ConnectionDetailsComponent],
  providers: [CloudflareMetaStore],
  template: `
    <app-connection-details
      [isVisible]="cloudflareMetaStore.isVisible()"
      [isLoading]="cloudflareMetaStore.isLoading()"
      [networkLabel]="cloudflareMetaStore.viewerNetworkLabel()"
      [locationLabel]="cloudflareMetaStore.viewerLocationLabel()"
      [ipLabel]="cloudflareMetaStore.viewerIpLabel()"
      (toggleVisibility)="toggleConnectionDetails()"
    />
  `,
  host: { class: 'block' },
})
export class ConnectionDetailsContainerComponent {
  protected readonly cloudflareMetaStore = inject(CloudflareMetaStore)

  protected toggleConnectionDetails(): void {
    const shouldLoadMeta = !this.cloudflareMetaStore.isVisible()
    this.cloudflareMetaStore.toggleVisibility()

    if (shouldLoadMeta) {
      void this.cloudflareMetaStore.load()
    }
  }
}
