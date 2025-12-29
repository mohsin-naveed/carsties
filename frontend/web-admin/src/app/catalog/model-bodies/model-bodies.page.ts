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
import { CatalogApiService, ModelBodyDto, ModelDto, MakeDto, OptionDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ModelBodyEditDialogComponent } from './model-body-edit-dialog.component';

@Component({
  selector: 'app-model-bodies-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatDialogModule],
  templateUrl: './model-bodies.page.html',
  styles:[`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
    table { width:100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelBodiesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  readonly displayedColumns = ['make','model','bodyType','seats','doors','actions'];

  readonly items$ = new BehaviorSubject<ModelBodyDto[]>([]);
  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly bodyTypeMap$ = new BehaviorSubject<Record<number, string>>({});

  readonly modelById$ = this.models$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, ModelDto>)), shareReplay(1)
  );
  readonly makeById$ = this.makes$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, MakeDto>)), shareReplay(1)
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
        const btName = bodyTypes[it.bodyTypeId] ?? '';
        return (
          modelName.toLowerCase().includes(query) ||
          makeName.toLowerCase().includes(query) ||
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
    this.api.getBodyTypeOptions().subscribe({ next: (opts) => { this.bodyTypes = opts; this.bodyTypeMap = Object.fromEntries(opts.map(o => [o.id, o.name])); this.bodyTypeMap$.next(this.bodyTypeMap); } });
  }

  private loadContext(){
    this.api.getModelBodiesContext().subscribe({
      next: (ctx) => { this.makes$.next(ctx.makes); this.models$.next(ctx.models); this.items$.next(ctx.modelBodies); },
      error: () => this.notify.error('Failed to load model bodies')
    });
  }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(ModelBodyEditDialogComponent, { data: { title: 'Add Model Body', models: this.modelsCache }, width: '560px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { modelId: number; bodyTypeId: number; seats: number; doors: number } | undefined) => {
      if (res){ this.api.createModelBody(res).subscribe({ next: () => { this.notify.success('Model body created'); this.loadContext(); } }); }
    });
  }

  openEdit(it: ModelBodyDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(ModelBodyEditDialogComponent, { data: { title: 'Edit Model Body', models: this.modelsCache, modelId: it.modelId, bodyTypeId: it.bodyTypeId, seats: it.seats, doors: it.doors }, width: '560px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { modelId: number; bodyTypeId: number; seats: number; doors: number } | undefined) => {
      if (res){ this.api.updateModelBody(it.id, res).subscribe({ next: () => { this.notify.success('Model body updated'); this.loadContext(); } }); }
    });
  }

  remove(it: ModelBodyDto){
    if (!confirm(`Delete model body '${this.getBodyTypeName(it)}' for model '${this.getModelName(it)}'?`)) return;
    this.api.deleteModelBody(it.id).subscribe({ next: () => { this.notify.success('Model body deleted'); this.loadContext(); } });
  }

  getModelName(it: ModelBodyDto){ const model = this.models$.value.find(m => m.id === it.modelId); return model?.name ?? ''; }
  getMakeName(it: ModelBodyDto){ const model = this.models$.value.find(m => m.id === it.modelId); const make = model ? this.makes$.value.find(x => x.id === model.makeId) : undefined; return make?.name ?? ''; }
  getBodyTypeName(it: ModelBodyDto){ return this.bodyTypeMap[it.bodyTypeId] ?? ''; }
  onFilterInput(val: string){ this.filter$.next(val); }
}
