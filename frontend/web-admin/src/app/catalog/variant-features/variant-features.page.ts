import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CatalogApiService, VariantFeatureDto, VariantDto, FeatureDto, GenerationDto, ModelDto, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-variant-features-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
  <section class="header">
    <h2>Variant Feature Mapping</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Variant</mat-label>
        <mat-select formControlName="variantId">
          <mat-optgroup *ngFor="let g of variantGroups()" [label]="g.label">
            <mat-option *ngFor="let v of g.variants" [value]="v.id">{{ v.name }}</mat-option>
          </mat-optgroup>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Feature</mat-label>
        <mat-select formControlName="featureId">
          <mat-option *ngFor="let f of features()" [value]="f.id">{{ f.name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Standard?</mat-label>
        <mat-select formControlName="isStandard">
          <mat-option [value]="true">Yes</mat-option>
          <mat-option [value]="false">Optional</mat-option>
        </mat-select>
      </mat-form-field>
      <button mat-flat-button color="primary">Add</button>
    </form>
  </section>

  <table mat-table [dataSource]="items()" class="mat-elevation-z1">
    <ng-container matColumnDef="variant"><th mat-header-cell *matHeaderCellDef>Variant</th><td mat-cell *matCellDef="let it">{{ lookupVariant(it.variantId)?.name }}</td></ng-container>
    <ng-container matColumnDef="feature"><th mat-header-cell *matHeaderCellDef>Feature</th><td mat-cell *matCellDef="let it">{{ lookupFeature(it.featureId)?.name }}</td></ng-container>
    <ng-container matColumnDef="isStandard"><th mat-header-cell *matHeaderCellDef>Standard</th><td mat-cell *matCellDef="let it">{{ it.isStandard ? 'Yes' : 'Optional' }}</td></ng-container>
    <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let it"><button mat-icon-button color="warn" (click)="remove(it)"><mat-icon>delete</mat-icon></button></td></ng-container>
    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
  </table>
  `,
  styles:[`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
    table { width:100%; }
  `]
})
export class VariantFeaturesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly displayedColumns = ['variant','feature','isStandard','actions'];

  readonly items = signal<VariantFeatureDto[]>([]);
  readonly variants = signal<VariantDto[]>([]);
  readonly generations = signal<GenerationDto[]>([]);
  readonly models = signal<ModelDto[]>([]);
  readonly makes = signal<MakeDto[]>([]);
  readonly features = signal<FeatureDto[]>([]);

  readonly form = this.fb.nonNullable.group({
    variantId: [null as number | null, [Validators.required]],
    featureId: [null as number | null, [Validators.required]],
    isStandard: [true, [Validators.required]]
  });

  constructor(){
  this.api.getMakes().subscribe({ next: m => this.makes.set(m), error: () => this.notify.error('Failed to load makes') });
  this.api.getModels().subscribe({ next: m => this.models.set(m), error: () => this.notify.error('Failed to load models') });
  this.api.getGenerations().subscribe({ next: g => this.generations.set(g), error: () => this.notify.error('Failed to load generations') });
  this.api.getVariants().subscribe({ next: v => this.variants.set(v), error: () => this.notify.error('Failed to load variants') });
  this.api.getFeatures().subscribe({ next: f => this.features.set(f), error: () => this.notify.error('Failed to load features') });
    this.load();
  }

  load(){ this.api.getVariantFeatures().subscribe({ next: data => this.items.set(data), error: () => this.notify.error('Failed to load mappings') }); }

  variantGroups(){
    return this.variants().map(v => {
      const gen = this.generations().find(g => g.id === v.generationId);
      const model = gen ? this.models().find(m => m.id === gen.modelId) : undefined;
      const make = model ? this.makes().find(x => x.id === model.makeId) : undefined;
      return { label: `${make?.name ?? 'Make'} / ${model?.name ?? 'Model'} / ${gen?.name ?? 'Gen'}`, variants: [v] };
    });
  }

  lookupVariant(id: number){ return this.variants().find(v => v.id === id); }
  lookupFeature(id: number){ return this.features().find(f => f.id === id); }

  onSubmit(){
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    if (val.variantId == null || val.featureId == null) return;
    this.api.createVariantFeature({ variantId: val.variantId, featureId: val.featureId, isStandard: val.isStandard })
      .subscribe({ next: () => { this.notify.success('Mapping created'); this.form.reset({ variantId: null, featureId: null, isStandard: true }); this.load(); } });
  }

  remove(it: VariantFeatureDto){
    if (!confirm('Delete mapping?')) return;
  this.api.deleteVariantFeature(it.variantId, it.featureId).subscribe({ next: () => { this.notify.success('Mapping deleted'); this.load(); } });
  }
}
