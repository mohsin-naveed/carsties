import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CatalogApiService, MakeDto, ModelDto, OptionDto, GenerationDto } from '../catalog-api.service';

@Component({
  selector: 'app-derivative-edit-dialog',
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
        <mat-select formControlName="modelId" required (selectionChange)="onModelChange()">
          <mat-option *ngFor="let m of filteredModels" [value]="m.id">{{ m.name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Generation</mat-label>
        <mat-select formControlName="generationId" required [disabled]="!form.value.modelId">
          <mat-option *ngFor="let g of generations" [value]="g.id">{{ g.name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Body Type</mat-label>
        <mat-select formControlName="bodyTypeId" required>
          <mat-option *ngFor="let bt of bodyTypes" [value]="bt.id">{{ bt.name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <div class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Engine</mat-label>
          <input matInput type="text" formControlName="engine" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Transmission</mat-label>
          <mat-select formControlName="transmissionId">
            <mat-option *ngFor="let t of transmissions" [value]="t.id">{{ t.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Fuel</mat-label>
          <mat-select formControlName="fuelTypeId">
            <mat-option *ngFor="let f of fuelTypes" [value]="f.id">{{ f.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
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
export class DerivativeEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CatalogApiService);
  private readonly ref = inject(MatDialogRef<DerivativeEditDialogComponent>);
  bodyTypes: OptionDto[] = [];
  filteredModels: ModelDto[] = [];
  generations: GenerationDto[] = [];
  transmissions: OptionDto[] = [];
  fuelTypes: OptionDto[] = [];

  form = this.fb.group({
    makeId: [null as number | null, Validators.required],
    modelId: [null as number | null, Validators.required],
    generationId: [null as number | null, Validators.required],
    bodyTypeId: [null as number | null, Validators.required],
    engine: ['' as string | null],
    transmissionId: [null as number | null],
    fuelTypeId: [null as number | null],
    code: ['' as string | null],
    seats: [this.data.seats ?? 5, [Validators.required, Validators.min(2), Validators.max(9)]],
    doors: [this.data.doors ?? 4, [Validators.required, Validators.min(2), Validators.max(5)]]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; makes: MakeDto[]; models: ModelDto[]; modelId?: number; generationId?: number | null; bodyTypeId?: number; seats?: number; doors?: number; code?: string; engine?: string; transmissionId?: number | null; fuelTypeId?: number | null }){
    this.api.getBodyTypeOptions().subscribe({ next: (opts) => this.bodyTypes = opts });
    this.api.getVariantOptions().subscribe({ next: (opts) => { this.transmissions = opts.transmissions; this.fuelTypes = opts.fuelTypes; } });
    this.updateFilteredModels();
    if (this.data.modelId){
      this.form.patchValue({ modelId: this.data.modelId });
      this.onModelChange();
      if (this.data.generationId !== undefined){
        this.form.patchValue({ generationId: this.data.generationId ?? null });
      }
    }
    if (this.data.engine !== undefined) this.form.patchValue({ engine: this.data.engine ?? '' });
    if (this.data.transmissionId !== undefined) this.form.patchValue({ transmissionId: this.data.transmissionId ?? null });
    if (this.data.fuelTypeId !== undefined) this.form.patchValue({ fuelTypeId: this.data.fuelTypeId ?? null });
  }

  onMakeChange(){
    this.updateFilteredModels();
    if (this.form.value.modelId && !this.filteredModels.some(m => m.id === this.form.value.modelId)){
      this.form.patchValue({ modelId: null });
    }
    this.generations = [];
    this.form.patchValue({ generationId: null });
  }

  private updateFilteredModels(){
    const mk = this.form.value.makeId;
    this.filteredModels = (this.data.models ?? []).filter(m => m.makeId === mk);
  }

  onModelChange(){
    const modelId = this.form.value.modelId as number | null;
    this.generations = [];
    this.form.patchValue({ generationId: null });
    if (modelId){
      this.api.getGenerations(modelId).subscribe({ next: (gens) => this.generations = gens });
    }
  }

  submit(){ if (this.form.invalid) return; this.ref.close(this.form.value); }
  close(){ this.ref.close(); }
}
