import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CatalogApiService, FeatureDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-features-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './features.page.html',
  styles: [`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; }
    table { width:100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['id','name','description','actions'];
  readonly items$ = new BehaviorSubject<FeatureDto[]>([]);
  readonly editingId$ = new BehaviorSubject<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['']
  });

  constructor(){ this.load(); }
  load(){ this.api.getFeatures().subscribe({ next: data => this.items$.next(data), error: () => this.notify.error('Failed to load features') }); }

  edit(it: FeatureDto){ this.editingId$.next(it.id); this.form.patchValue({ name: it.name, description: it.description || '' }); }
  cancelEdit(){ this.editingId$.next(null); this.form.reset(); }

  onSubmit(){
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const id = this.editingId$.value;
    if (id){
      this.api.updateFeature(id, { name: val.name, description: val.description }).subscribe({ next: () => { this.notify.success('Feature updated'); this.cancelEdit(); this.load(); } });
    } else {
      this.api.createFeature({ name: val.name, description: val.description }).subscribe({ next: () => { this.notify.success('Feature created'); this.form.reset(); this.load(); } });
    }
  }

  remove(it: FeatureDto){ if (!confirm(`Delete feature '${it.name}'?`)) return; this.api.deleteFeature(it.id).subscribe({ next: () => { this.notify.success('Feature deleted'); this.load(); } }); }
}
