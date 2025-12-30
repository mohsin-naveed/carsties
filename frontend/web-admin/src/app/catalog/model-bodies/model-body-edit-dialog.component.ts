import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CatalogApiService, MakeDto, ModelDto, OptionDto } from '../catalog-api.service';

@Component({
  selector: 'app-model-body-edit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  styles: [
    `.form { display:flex; flex-direction:column; gap:12px; }
     .form mat-form-field { width:100%; }`
  ],
  template: `
  <h2 mat-dialog-title>{{ data.title || 'Derivatives' }}</h2>
  <div mat-dialog-content>
    <form class="form" [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field appearance="outline">
        <mat-label>Make</mat-label>
        <mat-select formControlName="makeId" required (selectionChange)="onMakeChange()">
          <mat-option *ngFor="let mk of data.makes" [value]="mk.id">{{ mk.name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Model</mat-label>
        <mat-select formControlName="modelId" required>
          <mat-option *ngFor="let m of filteredModels" [value]="m.id">{{ m.name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Body Type</mat-label>
        <mat-select formControlName="bodyTypeId" required>
          <mat-option *ngFor="let bt of bodyTypes" [value]="bt.id">{{ bt.name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Body Code</mat-label>
        <input matInput type="text" formControlName="code" placeholder="e.g. E90" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Seats</mat-label>
        <input matInput type="number" formControlName="seats" required min="2" max="9" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Doors</mat-label>
        <input matInput type="number" formControlName="doors" required min="2" max="5" />
      </mat-form-field>
    </form>
  </div>
  <div mat-dialog-actions align="end">
    <button mat-button type="button" (click)="close()">Cancel</button>
    <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid" (click)="submit()">Save</button>
  </div>
  `
})
export class ModelBodyEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CatalogApiService);
  private readonly ref = inject(MatDialogRef<ModelBodyEditDialogComponent>);
  bodyTypes: OptionDto[] = [];
  filteredModels: ModelDto[] = [];

  form = this.fb.group({
    makeId: [null as number | null, Validators.required],
    modelId: [null as number | null, Validators.required],
    bodyTypeId: [null as number | null, Validators.required],
    code: ['' as string | null],
    seats: [this.data.seats ?? 5, [Validators.required, Validators.min(2), Validators.max(9)]],
    doors: [this.data.doors ?? 4, [Validators.required, Validators.min(2), Validators.max(5)]]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; makes: MakeDto[]; models: ModelDto[]; modelId?: number; bodyTypeId?: number; seats?: number; doors?: number; code?: string }){
    this.api.getBodyTypeOptions().subscribe({ next: (opts) => this.bodyTypes = opts });
    // No prepopulation of dropdowns; start with empty selections
    this.updateFilteredModels();
  }

  onMakeChange(){
    this.updateFilteredModels();
    if (this.form.value.modelId && !this.filteredModels.some(m => m.id === this.form.value.modelId)){
      this.form.patchValue({ modelId: null });
    }
  }

  private updateFilteredModels(){
    const mk = this.form.value.makeId;
    this.filteredModels = (this.data.models ?? []).filter(m => m.makeId === mk);
  }

  submit(){ if (this.form.invalid) return; this.ref.close(this.form.value); }
  close(){ this.ref.close(); }
}
