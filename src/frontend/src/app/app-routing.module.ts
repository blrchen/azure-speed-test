import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

const routes: Routes = [
  {
    path: "Azure",
    loadChildren: "./azure/azure.module#AzureModule"
  },
  {
    path: "Information",
    loadChildren: "./information/information.module#InformationModule"
  },
  {
    path: "**",
    redirectTo: "Azure",
    pathMatch: "full"
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
