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
import { CatalogApiService, GenerationDto, ModelDto, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, Subject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';

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
  readonly displayedColumns = ['id','name','model','years','actions'];

  private readonly reload$ = new BehaviorSubject<void>(undefined);

  readonly makes$ = this.api.getMakes().pipe(
    tap({ error: () => this.notify.error('Failed to load makes') }),
    catchError(() => of([] as MakeDto[])),
    shareReplay(1)
  );

  readonly models$ = this.api.getModels().pipe(
    tap({ error: () => this.notify.error('Failed to load models') }),
    catchError(() => of([] as ModelDto[])),
    shareReplay(1)
  );

  readonly items$ = this.reload$.pipe(
    switchMap(() => this.api.getGenerations().pipe(
      tap({ error: () => this.notify.error('Failed to load generations') }),
      catchError(() => of([] as GenerationDto[]))
    )),
    shareReplay(1)
  );

  // editing handled via dialog

  readonly modelById$ = this.models$.pipe(
    map((mdls) => mdls.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, ModelDto>)),
    shareReplay(1)
  );

  readonly makeGroups$ = combineLatest([this.makes$, this.models$]).pipe(
    map(([makes, models]) => makes.map(m => ({ name: m.name, models: models.filter(md => md.makeId === m.id) })))
  );

  // page-level form removed; dialogs will handle validation

  constructor(){
    this.load();
  }

  load(){ this.reload$.next(); }

  openCreate(models: ModelDto[]){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(GenerationEditDialogComponent, { data: { title: 'Add Generation', models }, width: '480px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; modelId: number; startYear?: number; endYear?: number } | undefined) => {
      if (res){
        this.api.createGeneration(res).subscribe({ next: () => { this.notify.success('Generation created'); this.load(); } });
      }
    });
  }

  openEdit(it: GenerationDto, models: ModelDto[]){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(GenerationEditDialogComponent, { data: { title: 'Edit Generation', name: it.name, modelId: it.modelId, startYear: it.startYear, endYear: it.endYear, models }, width: '480px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; modelId: number; startYear?: number; endYear?: number } | undefined) => {
      if (res){
        this.api.updateGeneration(it.id, res).subscribe({ next: () => { this.notify.success('Generation updated'); this.load(); } });
      }
    });
  }

  remove(it: GenerationDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete generation '${it.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteGeneration(it.id).subscribe({ next: () => { this.notify.success('Generation deleted'); this.load(); } });
      }
    });
  }
}
