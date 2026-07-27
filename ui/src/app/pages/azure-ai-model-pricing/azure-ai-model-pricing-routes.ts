import { Routes } from '@angular/router'

import {
  aiModelComparisonResolver,
  aiModelPricingCatalogResolver,
} from '../../services/ai-model-pricing-resolver'

export const AZURE_AI_MODEL_PRICING_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    resolve: { aiModelPricingCatalog: aiModelPricingCatalogResolver },
    loadComponent: () =>
      import('./azure-ai-model-price-list/azure-ai-model-price-list').then(
        (_) => _.AzureAiModelPriceList
      ),
  },
  {
    path: 'Compare',
    resolve: { aiModelComparisonPageData: aiModelComparisonResolver },
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('./azure-ai-model-comparison/azure-ai-model-comparison').then(
        (_) => _.AzureAiModelComparison
      ),
  },
]
