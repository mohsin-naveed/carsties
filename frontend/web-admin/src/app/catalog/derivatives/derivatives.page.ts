import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CatalogApiService, DerivativeDto, ModelDto, MakeDto, OptionDto } from '../catalog-api.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { DerivativeEditDialogComponent } from './derivative-edit-dialog.component';

@Component({
  selector: 'app-derivatives-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatDialogModule, MatPaginatorModule, MatSortModule, MatTooltipModule, MatDividerModule],
  templateUrl: './derivatives.page.html',
  styles:[`
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
export class DerivativesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  readonly displayedColumns = ['make','model','name','bodyType','driveType','fuel','transmission','power','seats','doors','active','actions'];

  readonly items$ = new BehaviorSubject<DerivativeDto[]>([]);
  readonly total$ = new BehaviorSubject<number>(0);
  readonly page$ = new BehaviorSubject<number>(1);
  readonly pageSize$ = new BehaviorSubject<number>(10);
  readonly sort$ = new BehaviorSubject<{ active: string; direction: 'asc'|'desc' }>({ active: 'make', direction: 'asc' });
  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly bodyTypeMap$ = new BehaviorSubject<Record<number, string>>({});
  readonly selectedMakeId$ = new BehaviorSubject<number | null>(null);
  readonly selectedModelId$ = new BehaviorSubject<number | null>(null);

  readonly modelById$ = this.models$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, ModelDto>)), shareReplay(1)
  );
  readonly makeById$ = this.makes$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, MakeDto>)), shareReplay(1)
  );
  readonly modelsForMake$ = combineLatest([this.models$, this.selectedMakeId$]).pipe(
    map(([models, makeId]) => makeId ? models.filter(m => m.makeId === makeId) : models)
  );

  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.items$, this.models$, this.makes$, this.bodyTypeMap$, this.filter$]).pipe(
    map(([items, models, makes, bodyTypes, q]) => {
      const query = q.toLowerCase().trim();
      if (!query) return items;
      const modelMap = models.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, ModelDto>);
      const makeMap = makes.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, MakeDto>);
      return items.filter(it => {
        const modelName = modelMap[it.modelId]?.name ?? '';
        const makeName = modelMap[it.modelId] ? makeMap[modelMap[it.modelId].makeId]?.name ?? '' : '';
        const derivativeName = (it.name ?? '').toLowerCase();
        const btName = bodyTypes[it.bodyTypeId] ?? '';
        return (
          modelName.toLowerCase().includes(query) ||
          makeName.toLowerCase().includes(query) ||
          derivativeName.includes(query) ||
          btName.toLowerCase().includes(query) ||
          String(it.seats).includes(query) ||
          String(it.doors).includes(query)
        );
      });
    })
  );

  private modelsCache: ModelDto[] = [];
  private makesCache: MakeDto[] = [];
  private bodyTypes: OptionDto[] = [];
  private bodyTypeMap: Record<number, string> = {};

  constructor(){
    this.models$.subscribe(ms => this.modelsCache = ms);
    this.makes$.subscribe(ms => this.makesCache = ms);
    this.loadContext();
    this.loadPage();
    this.api.getBodyTypeOptions().subscribe({ next: (opts) => { this.bodyTypes = opts; this.bodyTypeMap = Object.fromEntries(opts.map(o => [o.id, o.name])); this.bodyTypeMap$.next(this.bodyTypeMap); } });
    // When filters change, reset to first page and reload
    combineLatest([this.selectedMakeId$, this.selectedModelId$]).subscribe(() => { this.page$.next(1); this.loadPage(); });
    // Reset model when make changes
    this.selectedMakeId$.subscribe(() => { this.selectedModelId$.next(null); });
  }

  private loadContext(){
    this.api.getDerivativesContext().subscribe({
      next: (ctx) => { this.makes$.next(ctx.makes); this.models$.next(ctx.models); this.items$.next(ctx.derivatives); },
      error: () => this.notify.error('Failed to load derivatives')
    });
  }

  private loadPage(){
    const sort = this.sort$.value;
    const page = this.page$.value;
    const pageSize = this.pageSize$.value;
    const makeId = this.selectedMakeId$.value ?? undefined;
    const modelId = this.selectedModelId$.value ?? undefined;
    this.api.getDerivativesPaged({ page, pageSize, sort: sort.active, dir: sort.direction, makeId, modelId }).subscribe({
      next: (res) => { this.items$.next(res.items); this.total$.next(res.total); },
      error: () => this.notify.error('Failed to load derivatives')
    });
  }

  onPageChange(ev: PageEvent){ this.page$.next(ev.pageIndex + 1); this.pageSize$.next(ev.pageSize); this.loadPage(); }
  onSortChange(ev: Sort){ const dir = (ev.direction || 'asc') as 'asc'|'desc'; const active = ev.active || 'make'; this.sort$.next({ active, direction: dir }); this.page$.next(1); this.loadPage(); }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(DerivativeEditDialogComponent, { data: { title: 'Add Derivative', makes: this.makesCache, models: this.modelsCache }, width: '720px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; modelId: number; generationId: number; bodyTypeId: number; driveTypeId: number; seats: number; doors: number; engineCC?: number; engineL?: number; transmissionId?: number; fuelTypeId?: number; batteryKWh?: number; isActive?: boolean } | undefined) => {
      if (res){
        this.api.createDerivative(res).subscribe({ next: () => { this.notify.success('Derivative created'); this.loadContext(); this.loadPage(); } });
      }
    });
  }

  openEdit(it: DerivativeDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(DerivativeEditDialogComponent, { data: { title: 'Edit Derivative', makes: this.makesCache, models: this.modelsCache, name: it.name ?? '', modelId: it.modelId, generationId: it.generationId ?? null, bodyTypeId: it.bodyTypeId, driveTypeId: it.driveTypeId, seats: it.seats, doors: it.doors, engineCC: it.engineCC, engineL: it.engineL, transmissionId: it.transmissionId ?? null, fuelTypeId: it.fuelTypeId ?? null, batteryKWh: it.batteryKWh ?? null, isActive: it.isActive }, width: '720px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name?: string; modelId: number; generationId: number; bodyTypeId: number; driveTypeId: number; seats: number; doors: number; engineCC?: number; engineL?: number; transmissionId?: number; fuelTypeId?: number; batteryKWh?: number; isActive?: boolean } | undefined) => {
      if (res){
        this.api.updateDerivative(it.id, res).subscribe({ next: () => { this.notify.success('Derivative updated'); this.loadContext(); this.loadPage(); } });
      }
    });
  }

  openCopy(it: DerivativeDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(DerivativeEditDialogComponent, { data: { title: 'Copy Derivative', copyMode: true, makes: this.makesCache, models: this.modelsCache, name: it.name ?? '', modelId: it.modelId, generationId: it.generationId ?? null, bodyTypeId: it.bodyTypeId, driveTypeId: it.driveTypeId, seats: it.seats, doors: it.doors, engineCC: it.engineCC, engineL: it.engineL, transmissionId: it.transmissionId ?? null, fuelTypeId: it.fuelTypeId ?? null, batteryKWh: it.batteryKWh ?? null, isActive: it.isActive }, width: '720px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; modelId: number; generationId: number; bodyTypeId: number; driveTypeId: number; seats: number; doors: number; engineCC?: number; engineL?: number; transmissionId?: number; fuelTypeId?: number; batteryKWh?: number; isActive?: boolean } | undefined) => {
      if (res){
        this.api.createDerivative(res).subscribe({ next: () => { this.notify.success('Derivative copied'); this.loadContext(); this.loadPage(); } });
      }
    });
  }

  remove(it: DerivativeDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete derivative '${this.getBodyTypeName(it)}' for model '${this.getModelName(it)}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteDerivative(it.id).subscribe({ next: () => { this.notify.success('Derivative deleted'); this.loadContext(); this.loadPage(); } });
      }
    });
  }

  getModelName(it: DerivativeDto){ const model = this.models$.value.find(m => m.id === it.modelId); return model?.name ?? ''; }
  getMakeName(it: DerivativeDto){ const model = this.models$.value.find(m => m.id === it.modelId); const make = model ? this.makes$.value.find(x => x.id === model.makeId) : undefined; return make?.name ?? ''; }
  getBodyTypeName(it: DerivativeDto){ return this.bodyTypeMap[it.bodyTypeId] ?? ''; }
  getDriveType(it: DerivativeDto){ return it.driveType ?? ''; }
  getDriveCode(it: DerivativeDto){
    const name = (it.driveType ?? '').toLowerCase();
    if (!name) return '—';
    if (name.includes('front')) return 'FWD';
    if (name.includes('rear')) return 'RWD';
    if (name.includes('four')) return '4x4';
    return it.driveType ?? '—';
  }
  onFilterInput(val: string){ this.filter$.next(val); }

  isElectric(it: DerivativeDto){ return (it.fuelType ?? '').toLowerCase() === 'electric'; }
  isHybrid(it: DerivativeDto){ const name = (it.fuelType ?? '').toLowerCase(); return name.includes('hybrid') && name.includes('plug'); }
  private engineString(it: DerivativeDto): string {
    if (it.engineL != null) return `${Number(it.engineL).toFixed(1)}L`;
    if (it.engineCC != null) return `${it.engineCC}cc`;
    return '—';
  }
  powerLabel(it: DerivativeDto){
    if (this.isElectric(it)) return it.batteryKWh ? `${it.batteryKWh} kWh` : '—';
    if (this.isHybrid(it)) return [this.engineString(it), it.batteryKWh ? `${it.batteryKWh} kWh` : undefined].filter(Boolean).join(' + ');
    return this.engineString(it);
  }

  onMakeChange(id: number | null){ this.selectedMakeId$.next(id ?? null); }
  onModelChange(id: number | null){ this.selectedModelId$.next(id ?? null); }
}
