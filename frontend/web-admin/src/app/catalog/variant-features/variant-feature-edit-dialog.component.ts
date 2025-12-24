import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';
import { VariantDto, FeatureDto } from '../catalog-api.service';

@Component({
  selector: 'app-variant-feature-edit-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Variant</mat-label>
          <mat-select #variantSelect formControlName="variantId" cdkFocusInitial>
            <mat-option *ngFor="let v of data.variants" [value]="v.id">{{ v.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Feature</mat-label>
          <mat-select formControlName="featureId">
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
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
  `]
})
export class VariantFeatureEditDialogComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  public ref: MatDialogRef<VariantFeatureEditDialogComponent, { variantId: number; featureId: number; isStandard: boolean }> = inject(MatDialogRef);
  public data: { title: string; variantId?: number; featureId?: number; isStandard?: boolean; variants: VariantDto[]; features: FeatureDto[] } = inject(MAT_DIALOG_DATA);

  @ViewChild('variantSelect') variantSelect!: ElementRef<HTMLElement>;

  readonly form = this.fb.group({
    variantId: [this.data.variantId ?? null as number | null, [Validators.required]],
    featureId: [this.data.featureId ?? null as number | null, [Validators.required]],
    isStandard: [this.data.isStandard ?? true, [Validators.required]]
  });

  ngAfterViewInit(){ setTimeout(() => this.variantSelect?.nativeElement.focus(), 0); }

  save(){
    const raw = this.form.getRawValue();
    if (raw.variantId == null || raw.featureId == null) return;
    this.ref.close({ variantId: raw.variantId, featureId: raw.featureId, isStandard: raw.isStandard! });
  }
}
