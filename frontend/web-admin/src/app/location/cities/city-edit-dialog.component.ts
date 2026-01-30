import { Component, Inject, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LocationApiService, ProvinceDto } from '../location-api.service';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-city-edit-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="submit()" class="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Province</mat-label>
          <mat-select formControlName="provinceId" cdkFocusInitial>
            <mat-option *ngFor="let p of provinces" [value]="p.id">{{ p.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="form.controls.provinceId.hasError('required')">Province is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Name</mat-label>
          <ng-container *ngIf="!isEdit; else singleLine">
            <textarea matInput formControlName="name" placeholder="Comma-separated to add multiple"></textarea>
          </ng-container>
          <ng-template #singleLine>
            <input matInput formControlName="name" />
          </ng-template>
          <mat-error *ngIf="form.controls.name.hasError('required')">Name is required</mat-error>
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
  isEdit = false;
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    provinceId: new FormControl<number | null>(null, { validators: [Validators.required] })
  });
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; name?: string; provinceId?: number; provinces?: ProvinceDto[]; isEdit?: boolean }, private ref: MatDialogRef<CityEditDialogComponent>){
    if (data?.provinces) this.provinces = data.provinces;
    if (data?.name) this.form.patchValue({ name: data.name });
    if (data?.provinceId) this.form.patchValue({ provinceId: data.provinceId });
    this.isEdit = !!data?.isEdit;
  }
  submit(){ if (this.form.valid) this.ref.close(this.form.getRawValue()); }
}
