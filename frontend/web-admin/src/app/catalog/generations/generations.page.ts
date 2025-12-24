import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule],
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

  readonly editingId$ = new BehaviorSubject<number | null>(null);

  readonly modelById$ = this.models$.pipe(
    map((mdls) => mdls.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, ModelDto>)),
    shareReplay(1)
  );

  readonly makeGroups$ = combineLatest([this.makes$, this.models$]).pipe(
    map(([makes, models]) => makes.map(m => ({ name: m.name, models: models.filter(md => md.makeId === m.id) })))
  );

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    modelId: [null as number | null, [Validators.required]],
    startYear: [null as number | null],
    endYear: [null as number | null]
  });

  constructor(){
    this.load();
  }

  load(){ this.reload$.next(); }

  edit(it: GenerationDto){
    this.editingId$.next(it.id);
    this.form.patchValue({ name: it.name, modelId: it.modelId, startYear: it.startYear ?? null, endYear: it.endYear ?? null });
  }
  cancelEdit(){ this.editingId$.next(null); this.form.reset(); }

  onSubmit(){
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const id = this.editingId$.value;
    const payload = { name: val.name, modelId: val.modelId!, startYear: val.startYear ?? undefined, endYear: val.endYear ?? undefined };
    if (id){
      this.api.updateGeneration(id, payload).subscribe({ next: () => { this.notify.success('Generation updated'); this.cancelEdit(); this.load(); } });
    } else {
      this.api.createGeneration(payload).subscribe({ next: () => { this.notify.success('Generation created'); this.form.reset(); this.load(); } });
    }
  }

  remove(it: GenerationDto){ if (!confirm(`Delete generation '${it.name}'?`)) return; this.api.deleteGeneration(it.id).subscribe({ next: () => { this.notify.success('Generation deleted'); this.load(); } }); }
}
