import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GenerationEditDialogComponent } from './generation-edit-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { CatalogApiService, GenerationDto, ModelDto, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-generations-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatDialogModule, MatPaginatorModule, MatSortModule, MatDividerModule],
  templateUrl: './generations.page.html',
  styles: [`
    .header { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
    .spacer { flex:1 1 auto; }
    .controls { display:flex; align-items:end; justify-content:space-between; gap:.75rem; margin-bottom:.75rem; }
    .controls-left { display:grid; grid-template-columns: 1fr 1fr; gap:.75rem; align-items:end; }
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
export class GenerationsPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  readonly displayedColumns = ['make','model','name','years','actions'];

  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly items$ = new BehaviorSubject<GenerationDto[]>([]);
  readonly total$ = new BehaviorSubject<number>(0);
  readonly page$ = new BehaviorSubject<number>(1);
  readonly pageSize$ = new BehaviorSubject<number>(10);
  readonly sort$ = new BehaviorSubject<{ active: string; direction: 'asc'|'desc' }>({ active: 'make', direction: 'asc' });
  readonly selectedMakeId$ = new BehaviorSubject<number | null>(null);
  readonly selectedModelId$ = new BehaviorSubject<number | null>(null);

  // editing handled via dialog

  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.items$, this.models$, this.filter$]).pipe(
    map(([items, models, q]) => {
      const query = q.toLowerCase().trim();
      if (!query) return items;
      const modelMap = models.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, ModelDto>);
      return items.filter(it => {
        const modelName = modelMap[it.modelId]?.name ?? '';
        const years = `${it.startYear ?? ''} ${it.endYear ?? ''}`.toLowerCase();
        return (
          it.name.toLowerCase().includes(query) ||
          modelName.toLowerCase().includes(query) ||
          years.includes(query) ||
          String(it.id).includes(query)
        );
      });
    })
  );

  readonly modelById$ = this.models$.pipe(
    map((mdls) => mdls.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, ModelDto>)),
    shareReplay(1)
  );
  readonly makeById$ = this.makes$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, MakeDto>)),
    shareReplay(1)
  );

  private modelsCache: ModelDto[] = [];
  private makesCache: MakeDto[] = [];

  readonly modelsForMake$ = combineLatest([this.models$, this.selectedMakeId$]).pipe(
    map(([models, makeId]) => makeId ? models.filter(m => m.makeId === makeId) : models)
  );

  // page-level form removed; dialogs will handle validation

  constructor(){
    this.loadContext();
    this.loadPage();
    this.models$.subscribe(ms => { this.modelsCache = ms; });
    this.makes$.subscribe(ms => { this.makesCache = ms; });
    // When filters change, reset to first page and reload
    combineLatest([this.selectedMakeId$, this.selectedModelId$]).subscribe(() => { this.page$.next(1); this.loadPage(); });
    // Reset model when make changes
    this.selectedMakeId$.subscribe(() => { this.selectedModelId$.next(null); });
  }

  load(){ this.loadContext(); }
  private loadContext(makeId?: number, modelId?: number){
    this.api.getGenerationsContext(makeId, modelId).subscribe({
      next: (ctx) => { this.makes$.next(ctx.makes); this.models$.next(ctx.models); },
      error: () => this.notify.error('Failed to load generations')
    });
  }

  private loadPage(){
    const sort = this.sort$.value;
    const page = this.page$.value;
    const pageSize = this.pageSize$.value;
    const makeId = this.selectedMakeId$.value ?? undefined;
    const modelId = this.selectedModelId$.value ?? undefined;
    this.api.getGenerationsPaged({ page, pageSize, sort: sort.active, dir: sort.direction, makeId, modelId }).subscribe({
      next: (res) => { this.items$.next(res.items); this.total$.next(res.total); },
      error: () => this.notify.error('Failed to load generations')
    });
  }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(GenerationEditDialogComponent, { data: { title: 'Add Generation', models: this.modelsCache, makes: this.makesCache }, width: '480px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; modelId: number; startYear?: number; endYear?: number } | undefined) => {
      if (res){
        this.api.createGeneration(res).subscribe({ next: () => { this.notify.success('Generation created'); this.loadContext(); } });
      }
    });
  }

  openEdit(it: GenerationDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const model = this.modelsCache.find(m => m.id === it.modelId);
    const makeId = model?.makeId;
    const ref = this.dialog.open(GenerationEditDialogComponent, { data: { title: 'Edit Generation', name: it.name, makeId, modelId: it.modelId, startYear: it.startYear, endYear: it.endYear, models: this.modelsCache, makes: this.makesCache }, width: '480px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; modelId: number; startYear?: number; endYear?: number } | undefined) => {
      if (res){
        this.api.updateGeneration(it.id, res).subscribe({ next: () => { this.notify.success('Generation updated'); this.loadContext(); } });
      }
    });
  }

  remove(it: GenerationDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete generation '${it.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteGeneration(it.id).subscribe({ next: () => { this.notify.success('Generation deleted'); this.loadContext(); this.loadPage(); } });
      }
    });
  }

  getMakeNameByGeneration(it: GenerationDto){
    const model = this.modelsCache.find((m: ModelDto) => m.id === it.modelId);
    if (!model) return '';
    const make = this.makesCache.find((x: MakeDto) => x.id === model.makeId);
    return make?.name ?? '';
  }

  getModelNameByGeneration(it: GenerationDto){
    const model = this.modelsCache.find((m: ModelDto) => m.id === it.modelId);
    return model?.name ?? '';
  }

  onFilterInput(val: string){ this.filter$.next(val); }
  onPageChange(ev: PageEvent){ this.page$.next(ev.pageIndex + 1); this.pageSize$.next(ev.pageSize); this.loadPage(); }
  onSortChange(ev: Sort){ const dir = (ev.direction || 'asc') as 'asc'|'desc'; const active = ev.active || 'make'; this.sort$.next({ active, direction: dir }); this.page$.next(1); this.loadPage(); }
  onMakeChange(id: number | null){ this.selectedMakeId$.next(id ?? null); }
  onModelChange(id: number | null){ this.selectedModelId$.next(id ?? null); }
}
