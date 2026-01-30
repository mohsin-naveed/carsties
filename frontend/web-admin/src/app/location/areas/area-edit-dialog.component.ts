import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ProvinceDto, CityDto } from '../location-api.service';

@Component({
  selector: 'app-area-edit-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="submit()" class="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Province</mat-label>
          <mat-select formControlName="provinceId" (selectionChange)="onProvinceChange()" cdkFocusInitial>
            <mat-option *ngFor="let p of provinces" [value]="p.id">{{ p.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="form.controls.provinceId.hasError('required')">Province is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>City</mat-label>
          <mat-select formControlName="cityId">
            <mat-option *ngFor="let c of filteredCities" [value]="c.id">{{ c.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="form.controls.cityId.hasError('required')">City is required</mat-error>
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
export class AreaEditDialogComponent {
  provinces: ProvinceDto[] = [];
  cities: CityDto[] = [];
  filteredCities: CityDto[] = [];
  isEdit = false;
  form = new FormGroup({
    provinceId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    cityId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] })
  });
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; name?: string; cityId?: number; provinceId?: number; provinces?: ProvinceDto[]; cities?: CityDto[]; isEdit?: boolean }, private ref: MatDialogRef<AreaEditDialogComponent>){
    this.provinces = data.provinces ?? [];
    this.cities = data.cities ?? [];
    if (data?.provinceId) this.form.patchValue({ provinceId: data.provinceId });
    if (data?.cityId) this.form.patchValue({ cityId: data.cityId });
    this.onProvinceChange();
    if (data?.name) this.form.patchValue({ name: data.name });
    this.isEdit = !!data?.isEdit;
  }
  onProvinceChange(){
    const pid = this.form.controls.provinceId.value;
    this.filteredCities = pid ? this.cities.filter(c => c.provinceId === pid) : this.cities;
    const val = this.form.controls.cityId.value;
    if (val == null || !this.filteredCities.some(c => c.id === val)){
      this.form.patchValue({ cityId: null });
    }
  }
  submit(){ if (this.form.valid) this.ref.close(this.form.getRawValue()); }
}
