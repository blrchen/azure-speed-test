import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NotFoundComponent, RegionGroupComponent } from '.'

@NgModule({
  declarations: [NotFoundComponent, RegionGroupComponent],
  imports: [CommonModule, FormsModule],
  exports: [NotFoundComponent, RegionGroupComponent]
})
export class SharedModule {}
