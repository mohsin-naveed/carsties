import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CatalogApiService, DerivativeDto, FeatureDto, GenerationDto, MakeDto, ModelDto, VariantDto } from '../catalog-api.service';

@Component({
  selector: 'app-variant-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Variant Details</h2>
    <div mat-dialog-content>
      <div class="grid">
        <div class="item"><span class="label">Name</span><span class="value">{{ variant.name }}</span></div>
        <div class="item"><span class="label">Make</span><span class="value">{{ make?.name || '—' }}</span></div>
        <div class="item"><span class="label">Model</span><span class="value">{{ model?.name || '—' }}</span></div>
        <div class="item"><span class="label">Generation</span><span class="value">{{ generationLabel() }}</span></div>
        <div class="item"><span class="label">Derivative</span><span class="value">{{ derivative?.name || '—' }}</span></div>
        <div class="item"><span class="label">Body Type</span><span class="value">{{ derivative?.bodyType || '—' }}</span></div>
        <div class="item"><span class="label">Drive</span><span class="value">{{ derivative?.driveType || '—' }}</span></div>
        <div class="item"><span class="label">Transmission</span><span class="value">{{ derivative?.transmission || '—' }}</span></div>
        <div class="item"><span class="label">Fuel</span><span class="value">{{ derivative?.fuelType || '—' }}</span></div>
        <div class="item"><span class="label">Engine (cc)</span><span class="value">{{ derivative?.engineCC ?? '—' }}</span></div>
        <div class="item"><span class="label">Engine (L)</span><span class="value">{{ derivative?.engineL ?? '—' }}</span></div>
        <div class="item"><span class="label">Battery (kWh)</span><span class="value">{{ derivative?.batteryKWh ?? '—' }}</span></div>
      </div>
      <h3 class="subheading"><mat-icon>list</mat-icon> Features</h3>
      <mat-nav-list *ngIf="features.length > 0; else noFeatures">
        <a mat-list-item *ngFor="let f of features">{{ f.name }}</a>
      </mat-nav-list>
      <ng-template #noFeatures><p>No features attached.</p></ng-template>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </div>
  `,
  styles: [
    `.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem 1rem;margin-bottom:1rem}
     .item{display:flex;justify-content:space-between;gap:.5rem}
     .label{color:#666}
     .subheading{display:flex;align-items:center;gap:.5rem;margin-top:.75rem}`
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
}
