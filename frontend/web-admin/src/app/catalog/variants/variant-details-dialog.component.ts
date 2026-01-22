import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { CatalogApiService, DerivativeDto, FeatureDto, GenerationDto, MakeDto, ModelDto, VariantDto } from '../catalog-api.service';

@Component({
  selector: 'app-variant-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule, MatIconModule, MatChipsModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>Variant Details</h2>
    <div mat-dialog-content>
      <div class="summary">
        <div class="title-row">
          <mat-icon color="primary">directions_car</mat-icon>
          <div class="title">{{ variant.name }}</div>
          <div class="spacer"></div>
          <div class="chipset">
            <span class="chip">{{ driveCode() }}</span>
            <span class="chip" *ngIf="derivative?.transmission">{{ derivative?.transmission }}</span>
            <span class="chip" *ngIf="derivative?.fuelType">{{ derivative?.fuelType }}</span>
          </div>
        </div>
        <div class="grid">
          <div class="item"><span class="label">Make</span><span class="value">{{ make?.name || '—' }}</span></div>
          <div class="item"><span class="label">Model</span><span class="value">{{ model?.name || '—' }}</span></div>
          <div class="item"><span class="label">Generation</span><span class="value">{{ generationLabel() }}</span></div>
          <div class="item"><span class="label">Derivative</span><span class="value">{{ derivative?.name || '—' }}</span></div>
          <div class="item"><span class="label">Body Type</span><span class="value">{{ derivative?.bodyType || '—' }}</span></div>
          <div class="item"><span class="label">Engine (CC)</span><span class="value">{{ derivative?.engineCC ?? '—' }}</span></div>
          <div class="item"><span class="label">Engine (L)</span><span class="value">{{ engineLDisplay() }}</span></div>
          <div class="item"><span class="label">Battery (kWh)</span><span class="value">{{ derivative?.batteryKWh ?? '—' }}</span></div>
        </div>
      </div>
      <mat-divider></mat-divider>
      <h3 class="subheading"><mat-icon>list</mat-icon> Features</h3>
      <div class="features" *ngIf="features.length > 0; else noFeatures">
        <mat-chip-set>
          <mat-chip *ngFor="let f of features" selected>{{ f.name }}</mat-chip>
        </mat-chip-set>
      </div>
      <ng-template #noFeatures><p class="muted">No features attached.</p></ng-template>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </div>
  `,
  styles: [
    `.summary{display:flex;flex-direction:column;gap:.75rem;margin-bottom:.75rem}
     .title-row{display:flex;align-items:center;gap:.5rem}
     .title{font-weight:600}
     .spacer{flex:1 1 auto}
     .chipset{display:flex;gap:.5rem}
     .chip{background:#eef2f7;border-radius:12px;padding:.125rem .5rem;font-size:.8rem}
    .grid{display:grid;grid-template-columns:1fr;gap:.5rem 1rem;margin-bottom:.5rem}
     .item{display:flex;justify-content:space-between;gap:.5rem}
     .label{color:#666}
     .subheading{display:flex;align-items:center;gap:.5rem;margin:.75rem 0}
     .features{padding:.25rem 0}
     .muted{color:#777}`
  ]
})
export class VariantDetailsDialogComponent {
  private readonly api = inject(CatalogApiService);
  private readonly ref = inject(MatDialogRef<VariantDetailsDialogComponent>);
  public data: { variant: VariantDto; derivatives: DerivativeDto[]; generations: GenerationDto[]; models: ModelDto[]; makes: MakeDto[] } = inject(MAT_DIALOG_DATA);

  variant = this.data.variant;
  derivative = this.data.derivatives.find(d => d.id === this.variant.derivativeId);
  generation = this.data.generations.find(g => g.id === (this.derivative?.generationId ?? -1));
  model = this.data.models.find(m => m.id === (this.derivative?.modelId ?? -1));
  make = this.model ? this.data.makes.find(x => x.id === this.model!.makeId) : undefined;

  features: FeatureDto[] = [];
  constructor(){
    this.api.getVariantFeatures(this.variant.id).subscribe({ next: (vfs) => {
      // We only need feature IDs and names; fetch all features once could be heavy. For now, map IDs to names via additional calls if necessary.
      // Simplification: variantfeatures endpoint returns featureId only; we will not resolve names here unless provided elsewhere.
      // To show names properly, call getFeatures and filter.
      this.api.getFeatures().subscribe({ next: (all) => {
        const ids = new Set(vfs.map(v => v.featureId));
        this.features = all.filter(f => ids.has(f.id));
      }});
    }});
  }

  generationLabel(){
    const g = this.generation;
    if (!g) return '—';
    const name = g.name;
    const start = g.startYear != null ? String(g.startYear) : '';
    const end = g.endYear != null ? String(g.endYear) : 'Present';
    const range = start || end ? `(${start}, ${end})` : '';
    return `${name} ${range}`.trim();
  }

  close(){ this.ref.close(); }

  driveCode(){
    const name = (this.derivative?.driveType || '').toLowerCase();
    if (!name) return '—';
    if (name.includes('front')) return 'FWD';
    if (name.includes('rear')) return 'RWD';
    if (name.includes('four') || name.includes('awd') || name.includes('4')) return '4WD';
    return this.derivative?.driveType || '—';
  }
  engineLDisplay(){
    const val = this.derivative?.engineL;
    return val != null ? Number(val).toFixed(1) : '—';
  }
}
