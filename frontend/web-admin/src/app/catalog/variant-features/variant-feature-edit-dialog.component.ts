import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';
import { VariantDto, FeatureDto, GenerationDto, ModelDto, MakeDto, DerivativeDto } from '../catalog-api.service';

@Component({
  selector: 'app-variant-feature-edit-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Make</mat-label>
          <mat-select formControlName="makeId" [disabled]="isEdit">
            <mat-option *ngFor="let mk of data.makes" [value]="mk.id">{{ mk.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Model</mat-label>
          <mat-select formControlName="modelId" [disabled]="!form.value.makeId || isEdit">
            <mat-option *ngFor="let md of filteredModels()" [value]="md.id">{{ md.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Variant</mat-label>
          <mat-select #variantSelect formControlName="variantId" cdkFocusInitial [disabled]="!form.value.modelId || isEdit">
            <mat-option *ngFor="let v of filteredVariants()" [value]="v.id">{{ v.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Feature</mat-label>
          <mat-select formControlName="featureIds" multiple>
            <mat-option *ngFor="let f of data.features" [value]="f.id">{{ f.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Standard?</mat-label>
          <mat-select formControlName="isStandard">
            <mat-option [value]="true">Yes</mat-option>
            <mat-option [value]="false">Optional</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
    </div>
  `,
  styles: [`
    .form { display:flex; flex-direction:column; gap:12px; }
    .form mat-form-field { width:100%; }
  `]
})
export class VariantFeatureEditDialogComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  public ref: MatDialogRef<VariantFeatureEditDialogComponent, { variantId: number; featureIds: number[]; isStandard: boolean }> = inject(MatDialogRef);
  public data: { title: string; variantId?: number; featureId?: number; isStandard?: boolean; variants: VariantDto[]; features: FeatureDto[]; generations: GenerationDto[]; models: ModelDto[]; makes: MakeDto[]; derivatives: DerivativeDto[] } = inject(MAT_DIALOG_DATA);

  get isEdit(){ return this.data.variantId != null && this.data.featureId != null; }

  @ViewChild('variantSelect') variantSelect!: ElementRef<HTMLElement>;

  readonly form = this.fb.group({
    makeId: [this.deriveMakeId(this.data.variantId) ?? null as number | null, [Validators.required]],
    modelId: [this.deriveModelId(this.data.variantId) ?? null as number | null, [Validators.required]],
    variantId: [this.data.variantId ?? null as number | null, [Validators.required]],
    featureIds: [this.data.featureId != null ? [this.data.featureId] : [], [Validators.required]],
    isStandard: [this.data.isStandard ?? true, [Validators.required]]
  });

  ngAfterViewInit(){ setTimeout(() => this.variantSelect?.nativeElement.focus(), 0); }

  save(){
    const raw = this.form.getRawValue();
    const variantId = raw.variantId as number | null;
    const featureIds = raw.featureIds as number[];
    if (variantId == null || !featureIds || featureIds.length === 0) return;
    this.ref.close({ variantId, featureIds, isStandard: raw.isStandard! });
  }

  filteredModels(): ModelDto[] {
    const makeId = this.form.value.makeId as number | null;
    if (!makeId) return [];
    return this.data.models.filter(m => m.makeId === makeId);
  }

  filteredVariants(): VariantDto[] {
    const modelId = this.form.value.modelId as number | null;
    if (!modelId) return [];
    const gensForModel = this.data.generations.filter(g => g.modelId === modelId).map(g => g.id);
    return this.data.variants.filter(v => {
      const d = this.data.derivatives.find(dd => dd.id === v.derivativeId);
      const genId = d?.generationId ?? -1;
      return gensForModel.includes(genId);
    });
  }

  private deriveMakeId(variantId?: number){
    if (!variantId) return null;
    const v = this.data.variants.find(x => x.id === variantId);
    const d = v ? this.data.derivatives.find(dd => dd.id === v.derivativeId) : undefined;
    const gen = d ? this.data.generations.find(g => g.id === (d.generationId ?? -1)) : undefined;
    if (!gen) return null;
    const model = this.data.models.find(m => m.id === gen.modelId);
    return model ? model.makeId : null;
  }

  private deriveModelId(variantId?: number){
    if (!variantId) return null;
    const v = this.data.variants.find(x => x.id === variantId);
    const d = v ? this.data.derivatives.find(dd => dd.id === v.derivativeId) : undefined;
    const gen = d ? this.data.generations.find(g => g.id === (d.generationId ?? -1)) : undefined;
    if (!gen) return null;
    return gen.modelId ?? null;
  }
}
