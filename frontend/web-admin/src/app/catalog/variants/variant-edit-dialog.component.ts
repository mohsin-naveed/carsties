import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { A11yModule } from '@angular/cdk/a11y';
import { DerivativeDto, FeatureDto, GenerationDto, MakeDto, ModelDto, OptionDto, CatalogApiService } from '../catalog-api.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-variant-edit-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ headerTitle }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Make</mat-label>
          <mat-select formControlName="makeId">
            <mat-option *ngFor="let mk of data.makes" [value]="mk.id">{{ mk.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Model</mat-label>
          <mat-select formControlName="modelId" [disabled]="!form.value.makeId">
            <mat-option *ngFor="let md of filteredModels()" [value]="md.id">{{ md.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Derivative</mat-label>
          <mat-select formControlName="derivativeId" [disabled]="!form.value.modelId">
            <mat-option *ngFor="let d of filteredDerivatives()" [value]="d.id">{{ d.name || d.bodyType || 'Derivative' }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Name</mat-label>
          <input #nameInput matInput formControlName="name" placeholder="e.g. 2.0 TDI" cdkFocusInitial />
        </mat-form-field>
        <div class="toggles">
          <mat-slide-toggle formControlName="isPopular">Popular</mat-slide-toggle>
          <mat-slide-toggle formControlName="isImported">Imported</mat-slide-toggle>
        </div>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Features</mat-label>
          <mat-select formControlName="featureIds" multiple>
            <mat-option *ngFor="let f of features" [value]="f.id">{{ f.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || !form.dirty">Save</button>
    </div>
  `,
  styles: [`
    .form { display:flex; flex-direction:column; gap:1rem; }
    .grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; }
    .toggles{ display:flex; gap:1rem; }
    @media (max-width: 768px){ .grid { grid-template-columns: 1fr; } }
  `]
})
export class VariantEditDialogComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CatalogApiService);
  public ref: MatDialogRef<VariantEditDialogComponent, { name: string; derivativeId: number; featureIds: number[]; isPopular?: boolean; isImported?: boolean }> = inject(MatDialogRef);
  public data: { title: string; name?: string; derivativeId?: number; generations: GenerationDto[]; derivatives: DerivativeDto[]; models: ModelDto[]; makes: MakeDto[]; featureIds?: number[]; isPopular?: boolean; isImported?: boolean; copyMode?: boolean } = inject(MAT_DIALOG_DATA);

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    name: [this.data.name ?? '', [Validators.required, Validators.maxLength(100)]],
    makeId: [this.deriveMakeIdFromDerivative(this.data.derivativeId) ?? null as number | null, [Validators.required]],
    modelId: [this.deriveModelIdFromDerivative(this.data.derivativeId) ?? null as number | null, [Validators.required]],
    derivativeId: [this.data.derivativeId ?? null as number | null, [Validators.required]],
    featureIds: [this.data.featureIds ?? [] as number[]],
    isPopular: [this.data.isPopular ?? false],
    isImported: [this.data.isImported ?? false]
  });
  isCopyMode = false;
  headerTitle = 'Add Variant';

  ngAfterViewInit(){ setTimeout(() => this.nameInput?.nativeElement.focus(), 0); }

  filteredModels(): ModelDto[] {
    const makeId = this.form.value.makeId as number | null;
    if (!makeId) return [];
    return this.data.models.filter(m => m.makeId === makeId);
  }
  filteredDerivatives(): DerivativeDto[] {
    const modelId = this.form.value.modelId as number | null;
    if (!modelId) return [];
    return this.data.derivatives.filter(d => d.modelId === modelId);
  }
  private deriveMakeIdFromDerivative(derivativeId?: number){
    if (!derivativeId) return null;
    const d = this.data.derivatives.find(x => x.id === derivativeId);
    if (!d) return null;
    const model = this.data.models.find(m => m.id === d.modelId);
    return model ? model.makeId : null;
  }
  private deriveModelIdFromDerivative(derivativeId?: number){
    if (!derivativeId) return null;
    const d = this.data.derivatives.find(x => x.id === derivativeId);
    return d ? d.modelId : null;
  }

  features: FeatureDto[] = [];
  constructor(){
    this.api.getFeatures().subscribe({ next: (fs) => this.features = fs });
    this.isCopyMode = !!this.data.copyMode;
    this.headerTitle = this.isCopyMode ? 'Copy Variant' : (this.data.title || 'Add Variant');
  }

  save(){
    const raw = this.form.getRawValue();
    this.ref.close({ name: raw.name!, derivativeId: raw.derivativeId!, featureIds: raw.featureIds ?? [], isPopular: raw.isPopular ?? undefined, isImported: raw.isImported ?? undefined });
  }
}
