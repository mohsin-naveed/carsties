var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
let ConfirmDialogComponent = class ConfirmDialogComponent {
    data;
    ref;
    constructor(data, ref) {
        this.data = data;
        this.ref = ref;
    }
    onCancel() { this.ref.close(false); }
    onConfirm() { this.ref.close(true); }
};
ConfirmDialogComponent = __decorate([
    Component({
        selector: 'app-confirm-dialog',
        standalone: true,
        imports: [MatDialogModule, MatButtonModule, MatIconModule],
        template: `
    <h2 mat-dialog-title>{{ data.title || 'Please confirm' }}</h2>
    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">{{ data.cancelText || 'Cancel' }}</button>
      <button mat-flat-button color="warn" (click)="onConfirm()">{{ data.confirmText || 'Delete' }}</button>
    </div>
  `,
    }),
    __param(0, Inject(MAT_DIALOG_DATA)),
    __metadata("design:paramtypes", [Object, MatDialogRef])
], ConfirmDialogComponent);
export { ConfirmDialogComponent };
//# sourceMappingURL=confirm-dialog.component.js.map