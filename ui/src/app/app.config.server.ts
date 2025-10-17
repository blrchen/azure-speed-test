import { ApplicationConfig, mergeApplicationConfig } from '@angular/core'
import { provideServerRendering } from '@angular/platform-server'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { appConfig } from './app.config'

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(), provideNoopAnimations()]
}

export const config = mergeApplicationConfig(appConfig, serverConfig)
