import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { CatalogApiService, ModelDto, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-models-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule],
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
  readonly displayedColumns = ['id','name','make','actions'];

  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly editingId$ = new BehaviorSubject<number | null>(null);
  readonly makeById$ = this.makes$.pipe(
    map(ms => ms.reduce((acc, m) => { acc[m.id] = m; return acc; }, {} as Record<number, MakeDto>)),
    shareReplay(1)
  );

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    makeId: [null as number | null, [Validators.required]]
  });

  constructor(){
    this.loadMakes();
    this.loadModels();
  }

  loadMakes(){ this.api.getMakes().subscribe(data => this.makes$.next(data)); }
  loadModels(){ this.api.getModels().subscribe({ next: data => this.models$.next(data), error: () => this.notify.error('Failed to load models') }); }

  edit(it: ModelDto){
    this.editingId$.next(it.id);
    this.form.patchValue({ name: it.name, makeId: it.makeId });
  }
  cancelEdit(){ this.editingId$.next(null); this.form.reset(); }

  onSubmit(){
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const id = this.editingId$.value;
    if (id){
      this.api.updateModel(id, { name: val.name, makeId: val.makeId || undefined }).subscribe({ next: () => { this.notify.success('Model updated'); this.cancelEdit(); this.loadModels(); } });
    } else {
      if (val.makeId == null) return;
      this.api.createModel({ name: val.name, makeId: val.makeId }).subscribe({ next: () => { this.notify.success('Model created'); this.form.reset(); this.loadModels(); } });
    }
  }

  remove(it: ModelDto){ if (!confirm(`Delete model '${it.name}'?`)) return; this.api.deleteModel(it.id).subscribe({ next: () => { this.notify.success('Model deleted'); this.loadModels(); } }); }
}
