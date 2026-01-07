import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snack = inject(MatSnackBar);
  success(message: string, action: string = 'OK'): MatSnackBarRef<any> { return this.open(message, action, ['notify-success']); }
  error(message: string, action: string = 'Dismiss'): MatSnackBarRef<any> { return this.open(message, action, ['notify-error']); }
  info(message: string, action: string = 'OK'): MatSnackBarRef<any> { return this.open(message, action, ['notify-info']); }
  private open(message: string, action: string, panelClass: string[]): MatSnackBarRef<any> {
    return this.snack.open(message, action, { duration: 3500, horizontalPosition: 'right', verticalPosition: 'top', panelClass });
  }
}
