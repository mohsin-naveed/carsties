import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { ModelEditDialogComponent } from './model-edit-dialog.component';
import { CatalogApiService, ModelDto, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-models-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatDialogModule, MatPaginatorModule, MatSortModule, MatDividerModule],
  templateUrl: './models.page.html',
  styles: [`
    .header { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
    .spacer { flex:1 1 auto; }
    .controls { display:flex; align-items:end; justify-content:space-between; gap:.75rem; margin-bottom:.75rem; }
    .controls-left { display:grid; grid-template-columns: 1fr 1fr; gap:.75rem; align-items:end; }
    .controls-right { display:flex; align-items:end; }
    .search { width:320px; max-width:40vw; }
    table { width:100%; }
    th.mat-header-cell { font-weight: 600; }
    td.mat-cell, th.mat-header-cell { padding: .5rem .75rem; }
    .actions-cell { display:flex; align-items:center; gap:.25rem; white-space:nowrap; }
    tr.mat-row:hover { background: rgba(0,0,0,0.03); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelsPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  readonly displayedColumns = ['make','model','popular','active','actions'];

  readonly items$ = new BehaviorSubject<ModelDto[]>([]);
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly total$ = new BehaviorSubject<number>(0);
  readonly page$ = new BehaviorSubject<number>(1);
  readonly pageSize$ = new BehaviorSubject<number>(10);
  readonly sort$ = new BehaviorSubject<{ active: string; direction: 'asc'|'desc' }>({ active: 'make', direction: 'asc' });
  readonly selectedMakeId$ = new BehaviorSubject<number | null>(null);
  // editing handled via dialog
  readonly makeById$ = this.makes$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, MakeDto>)),
    shareReplay(1)
  );

  // page-level form removed; dialogs will handle validation
  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.items$, this.makes$, this.filter$]).pipe(
    map(([items, makes, q]) => {
      const query = q.toLowerCase().trim();
      if (!query) return items;
      const makeMap = makes.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, MakeDto>);
      return items.filter(it => {
        const makeName = makeMap[it.makeId]?.name ?? '';
        return (
          it.name.toLowerCase().includes(query) ||
          makeName.toLowerCase().includes(query) ||
          String(it.id).includes(query)
        );
      });
    })
  );

  constructor(){
    this.loadContext();
    this.loadPage();
    // When make filter changes, reset to first page and reload
    this.selectedMakeId$.subscribe(() => { this.page$.next(1); this.loadPage(); });
  }

  private loadContext(makeId?: number){
    this.api.getModelsContext(makeId).subscribe({
      next: (ctx) => { this.makes$.next(ctx.makes); },
      error: () => this.notify.error('Failed to load models')
    });
  }

  private loadPage(){
    const sort = this.sort$.value;
    const page = this.page$.value;
    const pageSize = this.pageSize$.value;
    const makeId = this.selectedMakeId$.value ?? undefined;
    this.api.getModelsPaged({ page, pageSize, sort: sort.active, dir: sort.direction, makeId }).subscribe({
      next: (res) => { this.items$.next(res.items); this.total$.next(res.total); },
      error: () => this.notify.error('Failed to load models')
    });
  }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(ModelEditDialogComponent, { data: { title: 'Add Model', makes: this.makes$.value }, width: '520px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; makeId: number; isActive?: boolean; isPopular?: boolean } | undefined) => {
      if (res){ this.api.createModel(res).subscribe({ next: () => { this.notify.success('Model created'); this.loadContext(); this.loadPage(); } }); }
    });
  }

  openEdit(it: ModelDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(ModelEditDialogComponent, { data: { title: 'Edit Model', name: it.name, makeId: it.makeId, isActive: it.isActive, isPopular: it.isPopular, makes: this.makes$.value }, width: '520px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name?: string; makeId?: number; isActive?: boolean; isPopular?: boolean } | undefined) => {
      if (res){ this.api.updateModel(it.id, res).subscribe({ next: () => { this.notify.success('Model updated'); this.loadContext(); this.loadPage(); } }); }
    });
  }

  remove(it: ModelDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete model '${it.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){ this.api.deleteModel(it.id).subscribe({ next: () => { this.notify.success('Model deleted'); this.loadContext(); this.loadPage(); } }); }
    });
  }

  onFilterInput(val: string){ this.filter$.next(val); }

  onPageChange(ev: PageEvent){ this.page$.next(ev.pageIndex + 1); this.pageSize$.next(ev.pageSize); this.loadPage(); }
  onSortChange(ev: Sort){ const dir = (ev.direction || 'asc') as 'asc'|'desc'; const active = ev.active || 'make'; this.sort$.next({ active, direction: dir }); this.page$.next(1); this.loadPage(); }
  onMakeChange(id: number | null){ this.selectedMakeId$.next(id ?? null); }
}
