import { Component, Inject, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LocationApiService, ProvinceDto } from '../location-api.service';

@Component({
  selector: 'app-city-edit-dialog',
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
          <mat-label>Province ID</mat-label>
          <input matInput type="number" formControlName="provinceId" required />
          <mat-error *ngIf="form.controls.provinceId.hasError('required')">Province is required</mat-error>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions>
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Save</button>
    </div>
  `
})
export class CityEditDialogComponent {
  private readonly api = inject(LocationApiService);
  provinces: ProvinceDto[] = [];
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    provinceId: new FormControl<number | null>(null, { validators: [Validators.required] })
  });
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; name?: string; provinceId?: number }, private ref: MatDialogRef<CityEditDialogComponent>){
    if (data?.name) this.form.patchValue({ name: data.name });
    if (data?.provinceId) this.form.patchValue({ provinceId: data.provinceId });
  }
  submit(){ if (this.form.valid) this.ref.close(this.form.getRawValue()); }
}
