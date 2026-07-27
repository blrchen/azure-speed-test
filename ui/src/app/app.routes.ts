import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/azure/azure.component').then((_) => _.AzureComponent),
    children: [
      {
        path: 'Azure',
        loadChildren: () => import('./pages/azure/azure-routes').then((_) => _.AZURE_ROUTES),
      },
      {
        path: 'AzureVmPricing',
        loadChildren: () =>
          import('./pages/azure-vm-pricing/azure-vm-pricing-routes').then(
            (_) => _.AZURE_VM_PRICING_ROUTES
          ),
      },
      {
        path: 'AzureAiModelPricing',
        loadChildren: () =>
          import('./pages/azure-ai-model-pricing/azure-ai-model-pricing-routes').then(
            (_) => _.AZURE_AI_MODEL_PRICING_ROUTES
          ),
      },
      {
        path: 'Information',
        loadChildren: () =>
          import('./pages/information/information-routes').then((_) => _.INFORMATION_ROUTES),
      },
      {
        path: 'Privacy',
        loadComponent: () =>
          import('./pages/privacy/privacy.component').then((_) => _.PrivacyComponent),
      },
      {
        path: '',
        redirectTo: 'Azure',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./pages/shared/not-found/not-found.component').then((_) => _.NotFoundComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/shared/not-found/not-found.component').then((_) => _.NotFoundComponent),
  },
]
