import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

const routes: Routes = [
  {
    path: "Azure",
    loadChildren: () => import("./azure/azure.module").then(m => m.AzureModule),
  },
  {
    path: "Information",
    loadChildren: () => import("./information/information.module").then(m => m.InformationModule),
  },
  {
    path: "**",
    redirectTo: "Azure",
    pathMatch: "full",
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
