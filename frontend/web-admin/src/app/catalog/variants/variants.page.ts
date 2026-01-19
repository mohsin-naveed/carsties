import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VariantEditDialogComponent } from './variant-edit-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CatalogApiService, VariantDto, GenerationDto, ModelDto, MakeDto, OptionDto, DerivativeDto, FeatureDto, CreateVariantFeatureDto, UpdateVariantDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-variants-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatDialogModule, MatPaginatorModule, MatSortModule, MatTooltipModule, MatDividerModule],
  templateUrl: './variants.page.html',
  styles:[`
    .header { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
    .spacer { flex:1 1 auto; }
    .controls { display:flex; align-items:end; justify-content:space-between; gap:.75rem; margin-bottom:.75rem; }
    .controls-left { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:.75rem; align-items:end; }
    .controls-right { display:flex; align-items:end; }
    .search { width:320px; max-width:40vw; }
    table { width:100%; }
    .actions-cell { display:flex; align-items:center; gap:.25rem; white-space:nowrap; }
    tr.mat-row:hover { background: rgba(0,0,0,0.03); }
    th.mat-header-cell { font-weight: 600; }
    td.mat-cell, th.mat-header-cell { padding: .5rem .75rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VariantsPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  readonly displayedColumns = ['make','model','name','generation','actions'];

  readonly items$ = new BehaviorSubject<VariantDto[]>([]);
  readonly generations$ = new BehaviorSubject<GenerationDto[]>([]);
  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly derivatives$ = new BehaviorSubject<DerivativeDto[]>([]);
  readonly total$ = new BehaviorSubject<number>(0);
  readonly page$ = new BehaviorSubject<number>(1);
  readonly pageSize$ = new BehaviorSubject<number>(10);
  readonly sort$ = new BehaviorSubject<{ active: string; direction: 'asc'|'desc' }>({ active: 'make', direction: 'asc' });
  readonly selectedMakeId$ = new BehaviorSubject<number | null>(null);
  readonly selectedModelId$ = new BehaviorSubject<number | null>(null);
  readonly selectedDerivativeId$ = new BehaviorSubject<number | null>(null);
  // editing handled via dialog
  readonly generationById$ = this.generations$.pipe(
    map(gs => gs.reduce((acc, g) => { acc[g.id] = g; return acc; }, {} as Record<number, GenerationDto>)), shareReplay(1)
  );
  readonly modelById$ = this.models$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, ModelDto>)), shareReplay(1)
  );
  readonly makeById$ = this.makes$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, MakeDto>)), shareReplay(1)
  );
  readonly generationGroups$ = combineLatest([this.generations$, this.models$, this.makes$]).pipe(
    map(([gens, models, makes]) => {
      const groups: { label: string; generations: GenerationDto[] }[] = [];
      for (const gen of gens){
        const model = models.find(m => m.id === gen.modelId);
        const make = model ? makes.find(x => x.id === model.makeId) : undefined;
        groups.push({ label: `${make?.name ?? 'Unknown'} / ${model?.name ?? 'Model'} (${gen.name})`, generations: [gen] });
      }
      return groups;
    })
  );

  // page-level form removed; dialogs will handle validation

  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.items$, this.generations$, this.derivatives$, this.filter$]).pipe(
    map(([items, generations, derivatives, q]) => {
      const query = q.toLowerCase().trim();
      if (!query) return items;
      const genMap = generations.reduce((acc, g) => { acc[g.id] = g; return acc; }, {} as Record<number, GenerationDto>);
      const dMap = derivatives.reduce((acc, d) => { acc[d.id] = d; return acc; }, {} as Record<number, DerivativeDto>);
      return items.filter(it => {
        const genName = dMap[it.derivativeId] ? genMap[dMap[it.derivativeId].generationId ?? -1]?.name ?? '' : '';
        return (
          it.name.toLowerCase().includes(query) ||
          genName.toLowerCase().includes(query) ||
          String(it.id).includes(query)
        );
      });
    })
  );
  readonly modelsForMake$ = combineLatest([this.models$, this.selectedMakeId$]).pipe(
    map(([models, makeId]) => makeId ? models.filter(m => m.makeId === makeId) : models)
  );
  readonly derivativesForModel$ = combineLatest([this.derivatives$, this.selectedModelId$]).pipe(
    map(([ders, modelId]) => modelId ? ders.filter(d => d.modelId === modelId) : ders)
  );
  
  private makesCache: MakeDto[] = [];
  private modelsCache: ModelDto[] = [];
  private generationsCache: GenerationDto[] = [];
  private derivativesCache: DerivativeDto[] = [];
  

  constructor(){
    this.makes$.subscribe(ms => this.makesCache = ms);
    this.models$.subscribe(ms => this.modelsCache = ms);
    this.generations$.subscribe(gs => this.generationsCache = gs);
    this.derivatives$.subscribe(ds => this.derivativesCache = ds);
    this.loadContext();
    this.loadPage();
    combineLatest([this.selectedMakeId$, this.selectedModelId$, this.selectedDerivativeId$]).subscribe(() => { this.page$.next(1); this.loadPage(); });
    this.selectedMakeId$.subscribe(() => { this.selectedModelId$.next(null); this.selectedDerivativeId$.next(null); });
    this.selectedModelId$.subscribe(() => { this.selectedDerivativeId$.next(null); });
  }

  load(){ this.loadContext(); }
  private loadContext(){
    this.api.getVariantsContext().subscribe({
      next: (ctx) => {
        this.makes$.next(ctx.makes);
        this.models$.next(ctx.models);
        this.derivatives$.next(ctx.derivatives);
        this.generations$.next(ctx.generations);
        // initial data can come from paged call
      },
      error: () => this.notify.error('Failed to load variants data')
    });
    
  }
  lookupGeneration(id: number){ return undefined; }

  getGenerationName(it: VariantDto){
    const d = this.derivatives$.value.find(x => x.id === it.derivativeId);
    if (!d) return '—';
    const gen = this.generations$.value.find(g => g.id === (d.generationId ?? -1));
    return gen?.name ?? '—';
  }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(VariantEditDialogComponent, { data: { title: 'Add Variant', generations: this.generationsCache, derivatives: this.derivativesCache, models: this.modelsCache, makes: this.makesCache }, width: '600px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; derivativeId: number; featureIds: number[] } | undefined) => {
      if (res){
        this.api.createVariant({ name: res.name, derivativeId: res.derivativeId }).subscribe({ next: (variant) => {
          const featureIds = res.featureIds ?? [];
          if (featureIds.length === 0){ this.notify.success('Variant created'); this.loadContext(); this.loadPage(); return; }
          let remaining = featureIds.length;
          featureIds.forEach(fid => {
            this.api.createVariantFeature({ variantId: variant.id, featureId: fid, isStandard: true }).subscribe({ next: () => {
              remaining--; if (remaining === 0){ this.notify.success('Variant created'); this.loadContext(); this.loadPage(); }
            }, error: () => { remaining--; if (remaining === 0){ this.notify.success('Variant created'); this.loadContext(); this.loadPage(); } } });
          });
        } });
      }
    });
  }

  openEdit(it: VariantDto){
    (document.activeElement as HTMLElement | null)?.blur();
    // Preload existing features then open dialog
    this.api.getVariantFeatures(it.id).subscribe({
      next: (existing) => {
        const preselectedIds = existing.map(vf => vf.featureId);
        const ref = this.dialog.open(VariantEditDialogComponent, {
          data: {
            title: 'Edit Variant',
            name: it.name,
            derivativeId: it.derivativeId,
            generations: this.generationsCache,
            derivatives: this.derivativesCache,
            models: this.modelsCache,
            makes: this.makesCache,
            featureIds: preselectedIds
          },
          width: '600px', autoFocus: true, restoreFocus: true
        });
        ref.afterClosed().subscribe((res: { name: string; derivativeId: number; featureIds: number[] } | undefined) => {
          if (!res) return;
          this.api.updateVariant(it.id, { name: res.name, derivativeId: res.derivativeId } as UpdateVariantDto).subscribe({
            next: () => {
              // Reset features: remove all then add selected
              this.api.getVariantFeatures(it.id).subscribe({
                next: (curr) => {
                  let remainingDeletes = curr.length;
                  if (remainingDeletes === 0){ this.addSelectedFeatures(it.id, res.featureIds ?? []); this.loadPage(); return; }
                  curr.forEach(vf => {
                    this.api.deleteVariantFeature(vf.variantId, vf.featureId).subscribe({
                      next: () => { remainingDeletes--; if (remainingDeletes === 0){ this.addSelectedFeatures(it.id, res.featureIds ?? []); this.loadPage(); } },
                      error: () => { remainingDeletes--; if (remainingDeletes === 0){ this.addSelectedFeatures(it.id, res.featureIds ?? []); this.loadPage(); } }
                    });
                  });
                },
                error: () => { this.notify.error('Failed to reload features'); }
              });
            },
            error: () => { this.notify.error('Failed to update variant'); }
          });
        });
      },
      error: () => this.notify.error('Failed to load current features')
    });
  }
  openCopy(it: VariantDto){
    (document.activeElement as HTMLElement | null)?.blur();
    // Copy should pre-populate values and disable Save until changed
    this.api.getVariantFeatures(it.id).subscribe({
      next: (existing) => {
        const preselectedIds = existing.map(vf => vf.featureId);
        const ref = this.dialog.open(VariantEditDialogComponent, {
          data: {
            title: 'Add Variant',
            name: it.name,
            derivativeId: it.derivativeId,
            generations: this.generationsCache,
            derivatives: this.derivativesCache,
            models: this.modelsCache,
            makes: this.makesCache,
            featureIds: preselectedIds,
            isPopular: it.isPopular,
            isImported: it.isImported,
            copyMode: true
          },
          width: '600px', autoFocus: true, restoreFocus: true
        });
        ref.afterClosed().subscribe((res: { name: string; derivativeId: number; featureIds: number[]; isPopular?: boolean; isImported?: boolean } | undefined) => {
          if (!res) return;
          // Create new variant with copied values (only if user changed anything)
          this.api.createVariant({ name: res.name, derivativeId: res.derivativeId, isPopular: res.isPopular, isImported: res.isImported }).subscribe({
            next: (variant) => {
              const featureIds = res.featureIds ?? [];
              if (featureIds.length === 0){ this.notify.success('Variant copied'); this.loadContext(); this.loadPage(); return; }
              let remaining = featureIds.length;
              featureIds.forEach(fid => {
                this.api.createVariantFeature({ variantId: variant.id, featureId: fid, isStandard: true }).subscribe({ next: () => {
                  remaining--; if (remaining === 0){ this.notify.success('Variant copied'); this.loadContext(); this.loadPage(); }
                }, error: () => { remaining--; if (remaining === 0){ this.notify.success('Variant copied'); this.loadContext(); this.loadPage(); } } });
              });
            },
            error: () => this.notify.error('Failed to copy variant')
          });
        });
      },
      error: () => this.notify.error('Failed to load current features')
    });
  }
  remove(it: VariantDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete variant '${it.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteVariant(it.id).subscribe({ next: () => { this.notify.success('Variant deleted'); this.loadContext(); this.loadPage(); } });
      }
    });
  }

  getModelName(it: VariantDto){
    const d = this.derivatives$.value.find(x => x.id === it.derivativeId);
    if (!d) return '';
    const model = this.models$.value.find(m => m.id === d.modelId);
    return model?.name ?? '';
  }

  getMakeName(it: VariantDto){
    const d = this.derivatives$.value.find(x => x.id === it.derivativeId);
    if (!d) return '';
    const model = this.models$.value.find(m => m.id === d.modelId);
    const make = model ? this.makes$.value.find(x => x.id === model.makeId) : undefined;
    return make?.name ?? '';
  }

  addSelectedFeatures(variantId: number, featureIds: number[]){
    if (!featureIds || featureIds.length === 0){ this.notify.success('Variant updated'); this.loadContext(); this.loadPage(); return; }
    let remaining = featureIds.length;
    featureIds.forEach(fid => {
      this.api.createVariantFeature({ variantId, featureId: fid, isStandard: true }).subscribe({ next: () => {
        remaining--; if (remaining === 0){ this.notify.success('Variant updated'); this.loadContext(); this.loadPage(); }
      }, error: () => { remaining--; if (remaining === 0){ this.notify.success('Variant updated'); this.loadContext(); this.loadPage(); } } });
    });
  }

  

  onFilterInput(val: string){ this.filter$.next(val); }
  onPageChange(ev: PageEvent){ this.page$.next(ev.pageIndex + 1); this.pageSize$.next(ev.pageSize); this.loadPage(); }
  onSortChange(ev: Sort){ const dir = (ev.direction || 'asc') as 'asc'|'desc'; const active = ev.active || 'make'; this.sort$.next({ active, direction: dir }); this.page$.next(1); this.loadPage(); }
  onMakeChange(id: number | null){ this.selectedMakeId$.next(id ?? null); }
  onModelChange(id: number | null){ this.selectedModelId$.next(id ?? null); }
  onDerivativeChange(id: number | null){ this.selectedDerivativeId$.next(id ?? null); }

  private loadPage(){
    const sort = this.sort$.value;
    const page = this.page$.value;
    const pageSize = this.pageSize$.value;
    const makeId = this.selectedMakeId$.value ?? undefined;
    const modelId = this.selectedModelId$.value ?? undefined;
    const derivativeId = this.selectedDerivativeId$.value ?? undefined;
    this.api.getVariantsPaged({ page, pageSize, sort: sort.active, dir: sort.direction, makeId, modelId, derivativeId }).subscribe({
      next: (res) => { this.items$.next(res.items); this.total$.next(res.total); },
      error: () => this.notify.error('Failed to load variants')
    });
  }
}
