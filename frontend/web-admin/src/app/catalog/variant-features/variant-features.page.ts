import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VariantFeatureEditDialogComponent } from './variant-feature-edit-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CatalogApiService, VariantFeatureDto, VariantDto, FeatureDto, GenerationDto, ModelDto, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-variant-features-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatDialogModule],
  templateUrl: './variant-features.page.html',
  styles:[`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
    table { width:100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VariantFeaturesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  readonly displayedColumns = ['make','model','variant','feature','isStandard','actions'];

  readonly items$ = new BehaviorSubject<VariantFeatureDto[]>([]);
  readonly variants$ = new BehaviorSubject<VariantDto[]>([]);
  readonly generations$ = new BehaviorSubject<GenerationDto[]>([]);
  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly features$ = new BehaviorSubject<FeatureDto[]>([]);
  readonly variantGroups$ = combineLatest([this.variants$, this.generations$, this.models$, this.makes$]).pipe(
    map(([variants, generations, models, makes]) => {
      const groups: { label: string; variants: VariantDto[] }[] = [];
      for (const v of variants){
        const gen = generations.find(g => g.id === v.generationId);
        const model = gen ? models.find(m => m.id === gen.modelId) : undefined;
        const make = model ? makes.find(x => x.id === model.makeId) : undefined;
        const label = `${make?.name ?? 'Make'} / ${model?.name ?? 'Model'} / ${gen?.name ?? 'Gen'}`;
        groups.push({ label, variants: [v] });
      }
      return groups;
    })
  );

  readonly generationById$ = this.generations$.pipe(
    map(gs => gs.reduce((acc, g) => { acc[g.id] = g; return acc; }, {} as Record<number, GenerationDto>)), shareReplay(1)
  );
  readonly modelById$ = this.models$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, ModelDto>)), shareReplay(1)
  );
  readonly makeById$ = this.makes$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, MakeDto>)), shareReplay(1)
  );

  // page-level form removed; dialogs will handle validation

  constructor(){
    this.loadContext();
  }

  load(){ this.loadContext(); }
  private loadContext(makeId?: number, modelId?: number, generationId?: number){
    this.api.getVariantFeaturesContext(makeId, modelId, generationId).subscribe({
      next: (ctx) => {
        this.makes$.next(ctx.makes);
        this.models$.next(ctx.models);
        this.generations$.next(ctx.generations);
        this.variants$.next(ctx.variants);
        this.features$.next(ctx.features);
      },
      error: () => this.notify.error('Failed to load mapping data')
    });
    this.api.getVariantFeatures().subscribe({ next: data => this.items$.next(data), error: () => this.notify.error('Failed to load mappings') });
  }

  lookupVariantName(id: number, variants: VariantDto[]){ return variants.find(v => v.id === id)?.name; }
  lookupFeatureName(id: number, features: FeatureDto[]){ return features.find(f => f.id === id)?.name; }

  openCreate(variants: VariantDto[], features: FeatureDto[]){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(VariantFeatureEditDialogComponent, { data: { title: 'Add Mapping', variants, features }, width: '560px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { variantId: number; featureId: number; isStandard: boolean } | undefined) => {
      if (res){
        this.api.createVariantFeature(res).subscribe({ next: () => { this.notify.success('Mapping created'); this.loadContext(); } });
      }
    });
  }

  openEdit(it: VariantFeatureDto, variants: VariantDto[], features: FeatureDto[]){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(VariantFeatureEditDialogComponent, { data: { title: 'Edit Mapping', variantId: it.variantId, featureId: it.featureId, isStandard: it.isStandard, variants, features }, width: '560px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { variantId: number; featureId: number; isStandard: boolean } | undefined) => {
      if (res){
        this.api.updateVariantFeature(it.variantId, it.featureId, { isStandard: res.isStandard }).subscribe({ next: () => { this.notify.success('Mapping updated'); this.loadContext(); } });
      }
    });
  }

  remove(it: VariantFeatureDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: 'Delete mapping?' } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteVariantFeature(it.variantId, it.featureId).subscribe({ next: () => { this.notify.success('Mapping deleted'); this.loadContext(); } });
      }
    });
  }

  readonly variantById$ = this.variants$.pipe(
    map(vs => vs.reduce((acc, v) => { acc[v.id] = v; return acc; }, {} as Record<number, VariantDto>)), shareReplay(1)
  );

  getModelName(variantId: number){
    const v = this.variants$.value.find(x => x.id === variantId);
    if (!v) return '';
    const gen = this.generations$.value.find(g => g.id === v.generationId);
    if (!gen) return '';
    const model = this.models$.value.find(m => m.id === gen.modelId);
    return model?.name ?? '';
  }

  getMakeName(variantId: number){
    const v = this.variants$.value.find(x => x.id === variantId);
    if (!v) return '';
    const gen = this.generations$.value.find(g => g.id === v.generationId);
    if (!gen) return '';
    const model = this.models$.value.find(m => m.id === gen.modelId);
    const make = model ? this.makes$.value.find(x => x.id === model.makeId) : undefined;
    return make?.name ?? '';
  }
}
