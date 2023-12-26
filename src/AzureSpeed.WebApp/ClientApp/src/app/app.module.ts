import { BrowserModule, Title } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgModule, ErrorHandler } from '@angular/core'
import { HttpClientModule } from '@angular/common/http'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { APIService, GlobalErrorHandler, RegionService } from './services'

@NgModule({
  declarations: [AppComponent],
  imports: [AppRoutingModule, BrowserAnimationsModule, BrowserModule, HttpClientModule],
  providers: [
    APIService,
    RegionService,
    Title,
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
