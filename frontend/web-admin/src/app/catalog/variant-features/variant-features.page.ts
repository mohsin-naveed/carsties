import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VariantFeatureEditDialogComponent } from './variant-feature-edit-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CatalogApiService, VariantFeatureDto, VariantDto, FeatureDto, GenerationDto, ModelDto, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-variant-features-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatDialogModule],
  templateUrl: './variant-features.page.html',
  styles:[`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
    .filter-field { margin-bottom:1rem; width:300px; display:block; }
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
  readonly filter$ = new BehaviorSubject<string>('');
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

  readonly filtered$ = combineLatest([this.items$, this.variants$, this.features$, this.generations$, this.models$, this.makes$, this.filter$]).pipe(
    map(([items, variants, features, generations, models, makes, q]) => {
      const query = q.toLowerCase().trim();
      if (!query) return items;
      return items.filter(it => {
        const variant = variants.find(v => v.id === it.variantId);
        const gen = variant ? generations.find(g => g.id === variant.generationId) : undefined;
        const model = gen ? models.find(m => m.id === gen.modelId) : undefined;
        const make = model ? makes.find(x => x.id === model.makeId) : undefined;
        const makeName = make?.name ?? '';
        const modelName = model?.name ?? '';
        const variantName = variant?.name ?? '';
        const featureName = features.find(f => f.id === it.featureId)?.name ?? '';
        const standardLabel = it.isStandard ? 'yes' : 'optional';
        return [makeName, modelName, variantName, featureName, standardLabel]
          .some(s => s.toLowerCase().includes(query));
      });
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

  onFilterInput(val: string){ this.filter$.next(val); }

  lookupVariantName(id: number, variants: VariantDto[]){ return variants.find(v => v.id === id)?.name; }
  lookupFeatureName(id: number, features: FeatureDto[]){ return features.find(f => f.id === id)?.name; }

  openCreate(variants: VariantDto[], features: FeatureDto[], generations: GenerationDto[], models: ModelDto[], makes: MakeDto[]){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(VariantFeatureEditDialogComponent, { data: { title: 'Add Variant Feature', variants, features, generations, models, makes }, width: '560px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { variantId: number; featureIds: number[]; isStandard: boolean } | undefined) => {
      if (res){
        const ops = res.featureIds.map(fid => this.api.createVariantFeature({ variantId: res.variantId, featureId: fid, isStandard: res.isStandard }));
        // Execute sequentially to keep UI consistent
        let done = 0;
        ops.forEach(op => op.subscribe({ next: () => { done++; if (done === ops.length){ this.notify.success('Mappings created'); this.loadContext(); } }, error: () => this.notify.error('Failed to create mapping') }));
      }
    });
  }

  openEdit(it: VariantFeatureDto, variants: VariantDto[], features: FeatureDto[], generations: GenerationDto[], models: ModelDto[], makes: MakeDto[]){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(VariantFeatureEditDialogComponent, { data: { title: 'Edit Variant Feature', variantId: it.variantId, featureId: it.featureId, isStandard: it.isStandard, variants, features, generations, models, makes }, width: '560px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { variantId: number; featureIds: number[]; isStandard: boolean } | undefined) => {
      if (res){
        const originalFeatureId = it.featureId;
        const selected = new Set(res.featureIds);
        const hasOriginal = selected.has(originalFeatureId);
        // Update isStandard for original if still selected
        const ops: Array<ReturnType<CatalogApiService['createVariantFeature']> | ReturnType<CatalogApiService['deleteVariantFeature']> | ReturnType<CatalogApiService['updateVariantFeature']>> = [];
        if (hasOriginal){
          ops.push(this.api.updateVariantFeature(it.variantId, originalFeatureId, { isStandard: res.isStandard }));
          selected.delete(originalFeatureId);
        } else {
          // Original removed -> delete it
          ops.push(this.api.deleteVariantFeature(it.variantId, originalFeatureId));
        }
        // Add any new features
        selected.forEach(fid => ops.push(this.api.createVariantFeature({ variantId: it.variantId, featureId: fid, isStandard: res.isStandard })));
        let done = 0; let failed = false;
        ops.forEach(op => op.subscribe({ next: () => { done++; if (done === ops.length && !failed){ this.notify.success('Mapping updated'); this.loadContext(); } }, error: () => { failed = true; this.notify.error('Failed to update mapping'); } }));
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
