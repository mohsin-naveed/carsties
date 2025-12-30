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
import { CatalogApiService, GenerationDto, ModelDto, MakeDto, ModelBodyDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-generations-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatDialogModule],
  templateUrl: './generations.page.html',
  styles: [`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
    table { width:100%; }
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
  readonly modelBodies$ = new BehaviorSubject<ModelBodyDto[]>([]);
  readonly items$ = new BehaviorSubject<GenerationDto[]>([]);

  // editing handled via dialog

  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.items$, this.models$, this.modelBodies$, this.filter$]).pipe(
    map(([items, models, modelBodies, q]) => {
      const query = q.toLowerCase().trim();
      if (!query) return items;
      const modelMap = models.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, ModelDto>);
      const modelBodyMap = modelBodies.reduce((acc, mb) => { acc[mb.id] = mb; return acc; }, {} as Record<number, ModelBodyDto>);
      return items.filter(it => {
        const modelId = modelBodyMap[it.modelBodyId]?.modelId;
        const modelName = modelId ? (modelMap[modelId]?.name ?? '') : '';
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
  private modelBodiesCache: ModelBodyDto[] = [];

  readonly makeGroups$ = combineLatest([this.makes$, this.models$]).pipe(
    map(([makes, models]) => makes.map(m => ({ name: m.name, models: models.filter(md => md.makeId === m.id) })))
  );

  // page-level form removed; dialogs will handle validation

  constructor(){
    this.loadContext();
    this.models$.subscribe(ms => { this.modelsCache = ms; });
    this.makes$.subscribe(ms => { this.makesCache = ms; });
    this.modelBodies$.subscribe(mbs => { this.modelBodiesCache = mbs; });
  }

  load(){ this.loadContext(); }
  private loadContext(makeId?: number, modelId?: number){
    this.api.getGenerationsContext(makeId, modelId).subscribe({
      next: (ctx) => { this.makes$.next(ctx.makes); this.models$.next(ctx.models); this.modelBodies$.next(ctx.modelBodies ?? []); this.items$.next(ctx.generations); },
      error: () => this.notify.error('Failed to load generations')
    });
  }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(GenerationEditDialogComponent, { data: { title: 'Add Generation', models: this.modelsCache, makes: this.makesCache, modelBodies: this.modelBodiesCache }, width: '480px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; modelBodyId: number; startYear?: number; endYear?: number } | undefined) => {
      if (res){
        this.api.createGeneration(res).subscribe({ next: () => { this.notify.success('Generation created'); this.loadContext(); } });
      }
    });
  }

  openEdit(it: GenerationDto){
    (document.activeElement as HTMLElement | null)?.blur();
    // derive model and make from the current modelBody
    const modelBody = this.modelBodiesCache.find(mb => mb.id === it.modelBodyId);
    const model = modelBody ? this.modelsCache.find(m => m.id === modelBody.modelId) : undefined;
    const makeId = model?.makeId;
    const ref = this.dialog.open(GenerationEditDialogComponent, { data: { title: 'Edit Generation', name: it.name, makeId, modelBodyId: it.modelBodyId, startYear: it.startYear, endYear: it.endYear, models: this.modelsCache, makes: this.makesCache, modelBodies: this.modelBodiesCache }, width: '480px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; modelBodyId: number; startYear?: number; endYear?: number } | undefined) => {
      if (res){
        this.api.updateGeneration(it.id, res).subscribe({ next: () => { this.notify.success('Generation updated'); this.loadContext(); } });
      }
    });
  }

  remove(it: GenerationDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete generation '${it.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteGeneration(it.id).subscribe({ next: () => { this.notify.success('Generation deleted'); this.loadContext(); } });
      }
    });
  }

  getMakeNameByGeneration(it: GenerationDto){
    const modelBody = this.modelBodiesCache.find(mb => mb.id === it.modelBodyId);
    const model = modelBody ? this.modelsCache.find((m: ModelDto) => m.id === modelBody.modelId) : undefined;
    if (!model) return '';
    const make = this.makesCache.find((x: MakeDto) => x.id === model.makeId);
    return make?.name ?? '';
  }

  getModelNameByGeneration(it: GenerationDto){
    const modelBody = this.modelBodiesCache.find(mb => mb.id === it.modelBodyId);
    const model = modelBody ? this.modelsCache.find((m: ModelDto) => m.id === modelBody.modelId) : undefined;
    return model?.name ?? '';
  }

  onFilterInput(val: string){ this.filter$.next(val); }
}
