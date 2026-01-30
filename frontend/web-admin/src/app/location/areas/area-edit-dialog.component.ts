import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-area-edit-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required />
          <mat-error *ngIf="form.controls.name.hasError('required')">Name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>City ID</mat-label>
          <input matInput type="number" formControlName="cityId" required />
          <mat-error *ngIf="form.controls.cityId.hasError('required')">City is required</mat-error>
        </mat-form-field>
        <div style="display:flex; gap:.75rem;">
          <mat-form-field appearance="outline" style="flex:1 1 0;">
            <mat-label>Latitude</mat-label>
            <input matInput type="number" formControlName="latitude" />
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:1 1 0;">
            <mat-label>Longitude</mat-label>
            <input matInput type="number" formControlName="longitude" />
          </mat-form-field>
        </div>
      </form>
    </div>
    <div mat-dialog-actions>
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Save</button>
    </div>
  `
})
export class AreaEditDialogComponent {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    cityId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    latitude: new FormControl<number | null>(null),
    longitude: new FormControl<number | null>(null)
  });
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; name?: string; cityId?: number; latitude?: number; longitude?: number }, private ref: MatDialogRef<AreaEditDialogComponent>){
    if (data?.name) this.form.patchValue({ name: data.name });
    if (data?.cityId) this.form.patchValue({ cityId: data.cityId });
    if (data?.latitude != null) this.form.patchValue({ latitude: data.latitude });
    if (data?.longitude != null) this.form.patchValue({ longitude: data.longitude });
  }
  submit(){ if (this.form.valid) this.ref.close(this.form.getRawValue()); }
}
