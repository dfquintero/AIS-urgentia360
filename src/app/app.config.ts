import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { DatasetService } from './core/services/dataset.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(DatasetService).cargar()),
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
    { provide: LOCALE_ID, useValue: 'es-CO' },
  ],
};
