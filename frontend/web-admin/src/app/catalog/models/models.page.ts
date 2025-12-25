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
import { ModelEditDialogComponent } from './model-edit-dialog.component';
import { CatalogApiService, ModelDto, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-models-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatDialogModule],
  templateUrl: './models.page.html',
  styles: [`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
    table { width:100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelsPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  readonly displayedColumns = ['make','model','actions'];

  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  // editing handled via dialog
  readonly makeById$ = this.makes$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, MakeDto>)),
    shareReplay(1)
  );

  // page-level form removed; dialogs will handle validation
  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.models$, this.makes$, this.filter$]).pipe(
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
  }

  private loadContext(makeId?: number){
    this.api.getModelsContext(makeId).subscribe({
      next: (ctx) => { this.makes$.next(ctx.makes); this.models$.next(ctx.models); },
      error: () => this.notify.error('Failed to load models')
    });
  }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(ModelEditDialogComponent, { data: { title: 'Add Model', makes: this.makes$.value }, width: '480px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; makeId: number } | undefined) => {
      if (res){ this.api.createModel(res).subscribe({ next: () => { this.notify.success('Model created'); this.loadContext(); } }); }
    });
  }

  openEdit(it: ModelDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(ModelEditDialogComponent, { data: { title: 'Edit Model', name: it.name, makeId: it.makeId, makes: this.makes$.value }, width: '480px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; makeId: number } | undefined) => {
      if (res){ this.api.updateModel(it.id, res).subscribe({ next: () => { this.notify.success('Model updated'); this.loadContext(); } }); }
    });
  }

  remove(it: ModelDto){ if (!confirm(`Delete model '${it.name}'?`)) return; this.api.deleteModel(it.id).subscribe({ next: () => { this.notify.success('Model deleted'); this.loadContext(); } }); }

  onFilterInput(val: string){ this.filter$.next(val); }
}
