var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
let NotificationService = class NotificationService {
    snack = inject(MatSnackBar);
    success(message, action = 'OK') { return this.open(message, action, ['notify-success']); }
    error(message, action = 'Dismiss') { return this.open(message, action, ['notify-error']); }
    info(message, action = 'OK') { return this.open(message, action, ['notify-info']); }
    open(message, action, panelClass) {
        return this.snack.open(message, action, { duration: 3500, horizontalPosition: 'right', verticalPosition: 'top', panelClass });
    }
};
NotificationService = __decorate([
    Injectable({ providedIn: 'root' })
], NotificationService);
export { NotificationService };
//# sourceMappingURL=notification.service.js.map