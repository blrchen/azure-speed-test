import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { LayoutComponent, NotFoundComponent, RegionsComponent } from "./index";

@NgModule({
  declarations: [LayoutComponent, NotFoundComponent, RegionsComponent],
  imports: [CommonModule, RouterModule, FormsModule],
  exports: [LayoutComponent, NotFoundComponent, RegionsComponent],
})
export class SharedModule {}
