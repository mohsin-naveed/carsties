import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from './notification.service';
export const errorInterceptor = (req, next) => {
    const notify = inject(NotificationService);
    return next(req).pipe(catchError((err) => {
        if (err instanceof HttpErrorResponse) {
            const msg = err.error?.message || err.statusText || 'Unexpected error';
            notify.error(msg);
        }
        else {
            notify.error('Unexpected error');
        }
        return throwError(() => err);
    }));
};
//# sourceMappingURL=error.interceptor.js.map