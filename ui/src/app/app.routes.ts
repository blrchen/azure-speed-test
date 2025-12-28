import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/azure/azure.component').then((_) => _.AzureComponent),
    children: [
      {
        path: 'Azure',
        loadChildren: () => import('./pages/azure/azure-routes').then((_) => _.AZURE_ROUTES)
      },
      {
        path: 'ChatGPT',
        loadChildren: () => import('./pages/chatgpt/chatgpt-routes').then((_) => _.CHATGPT_ROUTES)
      },
      {
        path: 'Information',
        loadChildren: () =>
          import('./pages/information/information-routes').then((_) => _.INFORMATION_ROUTES)
      },
      {
        path: 'Privacy',
        loadComponent: () =>
          import('./pages/privacy/privacy.component').then((_) => _.PrivacyComponent)
      },
      {
        path: '',
        redirectTo: 'Azure',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'Azure',
    pathMatch: 'full'
  }
]
