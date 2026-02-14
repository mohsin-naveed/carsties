import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from './notification.service';
import { BackendHealthService } from './backend-health.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const health = inject(BackendHealthService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        // Browser could not connect (service down / connection refused / CORS preflight failure).
        if (err.status === 0 && health.isUserServiceUrl(req.url)) {
          health.notifyUserServiceDown();
          return throwError(() => err);
        }

        const msg = err.error?.message || err.statusText || 'Unexpected error';
        notify.error(msg);
      } else {
        notify.error('Unexpected error');
      }
      return throwError(() => err);
    })
  );
};