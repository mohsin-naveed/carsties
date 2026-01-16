import { Component, Inject, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CatalogApiService, MakeDto, ModelDto, OptionDto, GenerationDto } from '../catalog-api.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subscription, combineLatest, startWith } from 'rxjs';

@Component({
  selector: 'app-derivative-edit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule],
  styles: [
    `.form { display:flex; flex-direction:column; gap:12px; }
     .form mat-form-field { width:100%; }`
  ],
  template: `
  <h2 mat-dialog-title>{{ headerTitle }}</h2>
  <div mat-dialog-content>
    <form class="form" [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput [value]="computedDisplayName || ''" disabled />
      </mat-form-field>
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
      <!-- Name input removed; name is auto-computed and shown above -->
      <mat-form-field appearance="outline">
        <mat-label>Body Type</mat-label>
        <mat-select formControlName="bodyTypeId" required>
          <mat-option *ngFor="let bt of bodyTypes" [value]="bt.id">{{ bt.name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <div class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Fuel</mat-label>
          <mat-select formControlName="fuelTypeId" (selectionChange)="onFuelChange()">
            <mat-option *ngFor="let f of fuelTypes" [value]="f.id">{{ f.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" *ngIf="!isElectricSelected()">
          <mat-label>Engine</mat-label>
          <input matInput type="text" formControlName="engine" />
        </mat-form-field>
        <mat-form-field appearance="outline" *ngIf="isElectricSelected() || isHybridSelected()">
          <mat-label>Battery (kWh)</mat-label>
          <input matInput type="number" formControlName="batteryCapacityKWh" min="1" step="0.1" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Transmission</mat-label>
          <mat-select formControlName="transmissionId">
            <mat-option *ngFor="let t of transmissions" [value]="t.id">{{ t.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline">
        <mat-label>Drive Type</mat-label>
        <mat-select formControlName="driveTypeId" required>
          <mat-option *ngFor="let dt of driveTypes" [value]="dt.id">{{ dt.name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Seats</mat-label>
        <mat-select formControlName="seats" required>
          <mat-option *ngFor="let s of seatOptions" [value]="s">{{ s }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Doors</mat-label>
        <mat-select formControlName="doors" required>
          <mat-option *ngFor="let d of doorOptions" [value]="d">{{ d }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-slide-toggle formControlName="isActive">Active</mat-slide-toggle>
    </form>
  </div>
  <div mat-dialog-actions align="end">
    <button mat-button type="button" (click)="close()">Cancel</button>
    <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid" (click)="submit()">Save</button>
  </div>
  `
})
export class DerivativeEditDialogComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CatalogApiService);
  private readonly ref = inject(MatDialogRef<DerivativeEditDialogComponent>);
  bodyTypes: OptionDto[] = [];
  driveTypes: OptionDto[] = [];
  filteredModels: ModelDto[] = [];
  generations: GenerationDto[] = [];
  transmissions: OptionDto[] = [];
  fuelTypes: OptionDto[] = [];
  private electricIds: number[] = [];
  private hybridIds: number[] = [];
  copyMode = false;
  seatOptions = Array.from({ length: 18 }, (_, i) => i + 1);
  doorOptions = Array.from({ length: 5 }, (_, i) => i + 1);
  computedDisplayName = '';
  headerTitle = 'Add Derivative';
  private sub?: Subscription;

  form = this.fb.group({
    name: ['' as string, [Validators.required, Validators.maxLength(100)]],
    makeId: [null as number | null, Validators.required],
    modelId: [null as number | null, Validators.required],
    generationId: [null as number | null, Validators.required],
    bodyTypeId: [null as number | null, Validators.required],
    driveTypeId: [null as number | null, Validators.required],
    engine: ['' as string | null],
    transmissionId: [null as number | null],
    fuelTypeId: [null as number | null],
    batteryCapacityKWh: [null as number | null],
    seats: [5, [Validators.required]],
    doors: [4, [Validators.required]],
    isActive: [true]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; makes: MakeDto[]; models: ModelDto[]; modelId?: number; generationId?: number | null; bodyTypeId?: number; seats?: number; doors?: number; code?: string; engine?: string; transmissionId?: number | null; fuelTypeId?: number | null; batteryCapacityKWh?: number | null; driveTypeId?: number | null; isActive?: boolean; copyMode?: boolean; name?: string }){
    this.api.getBodyTypeOptions().subscribe({ next: (opts) => this.bodyTypes = opts });
    this.api.getVariantOptions().subscribe({ next: (opts) => {
      this.transmissions = opts.transmissions; this.fuelTypes = opts.fuelTypes;
      const names = opts.fuelTypes.map(f => ({ id: f.id, name: f.name.toLowerCase() }));
      this.electricIds = names.filter(f => f.name === 'electric').map(f => f.id);
      this.hybridIds = names.filter(f => f.name.includes('hybrid') && f.name.includes('plug')).map(f => f.id);
    } });
    this.api.getDriveTypeOptions().subscribe({ next: (opts) => this.driveTypes = opts });
    this.copyMode = !!this.data.copyMode;
    this.headerTitle = this.copyMode ? 'Add Derivative' : (this.data.title || 'Add Derivative');
    // Pre-populate make based on model
    const model = this.data.modelId ? this.data.models.find(m => m.id === this.data.modelId) : undefined;
    if (model) this.form.patchValue({ makeId: model.makeId });
    this.updateFilteredModels();
    if (this.data.modelId){
      this.form.patchValue({ modelId: this.data.modelId });
      this.onModelChange();
      if (this.data.generationId !== undefined){
        this.form.patchValue({ generationId: this.data.generationId ?? null });
      }
    }
    if (this.data.name !== undefined){ this.form.patchValue({ name: this.data.name ?? '' }); }
    if (this.data.engine !== undefined) this.form.patchValue({ engine: this.data.engine ?? '' });
    if (this.data.transmissionId !== undefined) this.form.patchValue({ transmissionId: this.data.transmissionId ?? null });
    if (this.data.fuelTypeId !== undefined) this.form.patchValue({ fuelTypeId: this.data.fuelTypeId ?? null });
    if (this.data.batteryCapacityKWh !== undefined) this.form.patchValue({ batteryCapacityKWh: this.data.batteryCapacityKWh ?? null });
    if (this.data.bodyTypeId !== undefined) this.form.patchValue({ bodyTypeId: this.data.bodyTypeId ?? null });
    if (this.data.seats !== undefined) this.form.patchValue({ seats: this.data.seats ?? 5 });
    if (this.data.doors !== undefined) this.form.patchValue({ doors: this.data.doors ?? 4 });
    if ((this as any).data && (this as any).data['driveTypeId'] !== undefined) this.form.patchValue({ driveTypeId: (this as any).data['driveTypeId'] ?? null });
    if ((this as any).data && (this as any).data['isActive'] !== undefined) this.form.patchValue({ isActive: !!(this as any).data['isActive'] });
    this.onFuelChange();

    // Auto-compute derivative name and title based on selection
    const makeName$ = this.form.get('makeId')!.valueChanges.pipe(startWith(this.form.value.makeId));
    const modelId$ = this.form.get('modelId')!.valueChanges.pipe(startWith(this.form.value.modelId));
    const generationId$ = this.form.get('generationId')!.valueChanges.pipe(startWith(this.form.value.generationId));
    const bodyTypeId$ = this.form.get('bodyTypeId')!.valueChanges.pipe(startWith(this.form.value.bodyTypeId));
    const transmissionId$ = this.form.get('transmissionId')!.valueChanges.pipe(startWith(this.form.value.transmissionId));
    this.sub = combineLatest([makeName$, modelId$, generationId$, bodyTypeId$, transmissionId$]).subscribe(([mkId, mdId, genId, btId, trId]) => {
      const mk = this.data.makes.find(m => m.id === (mkId as number))?.name ?? '';
      const md = this.data.models.find(m => m.id === (mdId as number))?.name ?? '';
      const gn = this.generations.find(g => g.id === (genId as number))?.name ?? '';
      const bt = this.bodyTypes.find(b => b.id === (btId as number))?.name ?? '';
      const tr = this.transmissions.find(t => t.id === (trId as number))?.name ?? '';
      const parts = [mk, md, gn, bt, tr].filter(Boolean);
      const composed = parts.join(' ').trim();
      this.computedDisplayName = composed || '';
      this.form.patchValue({ name: composed }, { emitEvent: false });
    });
  }
  ngOnDestroy(){ this.sub?.unsubscribe(); }

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
      this.api.getGenerations(modelId).subscribe({ next: (gens) => { this.generations = gens; const cur = this.form.value.generationId; if (cur != null) { this.form.patchValue({ generationId: cur }); } } });
    }
  }

  onFuelChange(){
    const isE = this.isElectricSelected();
    const isH = this.isHybridSelected();
    const engineCtrl = this.form.get('engine');
    const battCtrl = this.form.get('batteryCapacityKWh');
    if (isE){
      engineCtrl?.clearValidators();
      battCtrl?.setValidators([Validators.required, Validators.min(1)]);
    } else if (isH) {
      // Both allowed; battery optional but must be positive if provided
      battCtrl?.setValidators([Validators.min(1)]);
      engineCtrl?.setValidators([Validators.maxLength(100)]);
    } else {
      battCtrl?.clearValidators();
      engineCtrl?.setValidators([Validators.maxLength(100)]);
    }
    engineCtrl?.updateValueAndValidity();
    battCtrl?.updateValueAndValidity();
  }

  isElectricSelected(){ const fid = this.form.value.fuelTypeId as number | null; return fid != null && this.electricIds.includes(fid); }
  isHybridSelected(){ const fid = this.form.value.fuelTypeId as number | null; return fid != null && this.hybridIds.includes(fid); }
  // Name is auto-computed; no manual editing

  submit(){ if (this.form.invalid) return; this.ref.close(this.form.value); }
  close(){ this.ref.close(); }
}
