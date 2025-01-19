import { NgModule } from '@angular/core'
import { provideHttpClient, withFetch } from '@angular/common/http'
import { BrowserModule, provideClientHydration } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'

@NgModule({
  declarations: [AppComponent],
  imports: [AppRoutingModule, BrowserAnimationsModule, BrowserModule],
  providers: [provideHttpClient(withFetch()), provideClientHydration()],
  bootstrap: [AppComponent]
})
export class AppModule {}
