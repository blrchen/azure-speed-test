import { BrowserModule, Title } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule, ErrorHandler } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import {
  APIService,
  ErrorTelemetryService,
  GlobalErrorHandler,
  RegionService,
} from "./services";
import { AzureModule } from "./azure/azure.module";
import { InformationModule } from "./information/information.module";

@NgModule({
  declarations: [AppComponent],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    AzureModule, // TODO: can this import be removed?
    InformationModule, // TODO: can this import be removed?
  ],
  providers: [
    ErrorTelemetryService,
    APIService,
    RegionService,
    Title,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
