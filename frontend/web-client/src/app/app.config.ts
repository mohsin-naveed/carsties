import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment.development';
import { apiBaseUrlInterceptor } from './core/api-base-url.interceptor';
import { errorInterceptor } from './core/error.interceptor';
import { authInterceptor } from './core/auth.interceptor';
import { routes } from './app.routes';
import { AbstractSecurityStorage, AuthModule, DefaultLocalStorageService, LogLevel } from 'angular-auth-oidc-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      apiBaseUrlInterceptor(environment.apiBaseUrl),
      authInterceptor,
      errorInterceptor
    ])),
    { provide: AbstractSecurityStorage, useClass: DefaultLocalStorageService },
    importProvidersFrom(
      AuthModule.forRoot({
        config: {
          authority: environment.identityAuthority,
          redirectUrl: environment.identityRedirectUrl,
          postLogoutRedirectUri: environment.identityPostLogoutRedirectUri,
          clientId: environment.identityClientId,
          scope: environment.identityScope,
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          logLevel: LogLevel.Debug
        }
      })
    )
  ]
};