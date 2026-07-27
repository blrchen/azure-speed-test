import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import { AI_MODEL_PRICING_ASSET_PATH, AiModelPricingCatalog } from './ai-model-pricing'

const REQUEST_OPTIONS = { transferCache: false } as const

@Injectable({ providedIn: 'root' })
export class AiModelPricingLoader {
  private readonly http = inject(HttpClient)
  private catalogPromise: Promise<AiModelPricingCatalog> | null = null

  getCatalog(): Promise<AiModelPricingCatalog> {
    this.catalogPromise ??= firstValueFrom(
      this.http.get<AiModelPricingCatalog>(AI_MODEL_PRICING_ASSET_PATH, REQUEST_OPTIONS)
    ).catch((error: unknown) => {
      this.catalogPromise = null
      throw error
    })
    return this.catalogPromise
  }
}
