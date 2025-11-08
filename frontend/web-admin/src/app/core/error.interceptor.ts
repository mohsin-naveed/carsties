import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  return next(req).pipe(
    catchError(err => {
      const status = err.status;
      let message = 'Unexpected error';
      if (err.error) {
        if (typeof err.error === 'string') message = err.error;
        else if (err.error.title) message = err.error.title;
        else if (err.error.message) message = err.error.message;
      } else if (status) {
        message = `Request failed (${status})`;
      }
      notify.error(message);
      return throwError(() => err);
    })
  );
};
