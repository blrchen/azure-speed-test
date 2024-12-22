import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

const routes: Routes = [
  {
    path: 'Azure',
    loadChildren: () => import('./pages/azure/azure.module').then((_) => _.AzureModule)
  },
  {
    path: 'ChatGPT',
    loadChildren: () => import('./pages/chatgpt/chatgpt.module').then((_) => _.ChatGPTModule)
  },
  {
    path: 'Information',
    loadChildren: () =>
      import('./pages/information/information.module').then((_) => _.InformationModule)
  },
  {
    path: '**',
    redirectTo: 'Azure',
    pathMatch: 'full'
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
