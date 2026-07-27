import { Component, computed, input } from '@angular/core'

import { VmCatalogMetadata, VmOperatingSystem, VmPriceMode } from '../../../services/vm-catalog'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

@Component({
  selector: 'app-vm-catalog-notice',
  imports: [LucideIconComponent],
  templateUrl: './vm-catalog-notice.html',
  host: { class: 'block' },
})
export class VmCatalogNotice {
  readonly catalog = input.required<VmCatalogMetadata>()
  readonly operatingSystem = input<VmOperatingSystem | null>(null)
  readonly priceMode = input<VmPriceMode | null>(null)

  readonly derivedPriceProfile = computed(() => {
    const operatingSystem = this.operatingSystem()
    const priceMode = this.priceMode()
    if (!operatingSystem || !priceMode) return null

    return (
      this.catalog().source.retailPrices.derivedPriceProfiles.find(
        (profile) => profile.operatingSystem === operatingSystem && profile.priceMode === priceMode
      ) ?? null
    )
  })
}
