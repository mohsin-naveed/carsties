import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material/core';
import { environment } from '../environments/environment.development';
import { apiBaseUrlInterceptor } from './core/api-base-url.interceptor';
import { errorInterceptor } from './core/error.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([
      apiBaseUrlInterceptor(environment.apiBaseUrl),
      errorInterceptor
    ])),
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: { disabled: false } }
  ]
};
