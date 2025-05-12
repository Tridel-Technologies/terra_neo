import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {

  providers: [
    provideAnimations(), // required animations providers
    provideToastr(),
    provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]

  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), 
    providePrimeNG({
      theme: {preset: Aura}
    })]

};
