import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ProfileApiService } from '../profile/profile-api.service';

export const profileCompleteGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const api = inject(ProfileApiService);
  const router = inject(Router);

  const desiredReturnUrl = auth.peekPostLoginRedirect() ?? state.url;

  // Important: wait for OIDC callback processing so we don't treat the initial
  // transient "not authenticated" value as final on the callback reload.
  return auth.ensureAuth$().pipe(
    take(1),
    switchMap(isAuth => {
      if (!isAuth) return of(true);

      return api.getMe().pipe(
        map(me => {
          if (me.isProfileComplete) return true;
          return router.createUrlTree(['/complete-profile'], {
            queryParams: { returnUrl: desiredReturnUrl }
          });
        }),
        catchError(() =>
          of(
            router.createUrlTree(['/complete-profile'], {
              queryParams: { returnUrl: desiredReturnUrl }
            })
          )
        )
      );
    })
  );
};
