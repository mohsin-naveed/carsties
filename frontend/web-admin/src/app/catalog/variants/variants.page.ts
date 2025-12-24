import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { CatalogApiService, VariantDto, GenerationDto, ModelDto, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-variants-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule],
  templateUrl: './variants.page.html',
  styles:[`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
    table { width:100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VariantsPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly displayedColumns = ['id','name','generation','engine','transmission','fuelType','actions'];

  readonly items$ = new BehaviorSubject<VariantDto[]>([]);
  readonly generations$ = new BehaviorSubject<GenerationDto[]>([]);
  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly editingId$ = new BehaviorSubject<number | null>(null);
  readonly generationById$ = this.generations$.pipe(
    map(gs => gs.reduce((acc, g) => { acc[g.id] = g; return acc; }, {} as Record<number, GenerationDto>)), shareReplay(1)
  );
  readonly generationGroups$ = combineLatest([this.generations$, this.models$, this.makes$]).pipe(
    map(([gens, models, makes]) => {
      const groups: { label: string; generations: GenerationDto[] }[] = [];
      for (const gen of gens){
        const model = models.find(m => m.id === gen.modelId);
        const make = model ? makes.find(x => x.id === model.makeId) : undefined;
        groups.push({ label: `${make?.name ?? 'Unknown'} / ${model?.name ?? 'Model'} (${gen.name})`, generations: [gen] });
      }
      return groups;
    })
  );

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    generationId: [null as number | null, [Validators.required]],
    engine: [''],
    transmission: [''],
    fuelType: ['']
  });

  constructor(){
    this.api.getMakes().subscribe({ next: m => this.makes$.next(m), error: () => this.notify.error('Failed to load makes') });
    this.api.getModels().subscribe({ next: m => this.models$.next(m), error: () => this.notify.error('Failed to load models') });
    this.api.getGenerations().subscribe({ next: g => this.generations$.next(g), error: () => this.notify.error('Failed to load generations') });
    this.load();
  }

  load(){ this.api.getVariants().subscribe({ next: data => this.items$.next(data), error: () => this.notify.error('Failed to load variants') }); }
  lookupGeneration(id: number){ return undefined; }

  edit(it: VariantDto){ this.editingId$.next(it.id); this.form.patchValue({ name: it.name, generationId: it.generationId, engine: it.engine || '', transmission: it.transmission || '', fuelType: it.fuelType || '' }); }
  cancelEdit(){ this.editingId$.next(null); this.form.reset(); }

  onSubmit(){
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const id = this.editingId$.value;
    const payload = { name: val.name, generationId: val.generationId!, engine: val.engine || undefined, transmission: val.transmission || undefined, fuelType: val.fuelType || undefined };
    if (id){ this.api.updateVariant(id, payload).subscribe({ next: () => { this.notify.success('Variant updated'); this.cancelEdit(); this.load(); } }); }
    else { this.api.createVariant(payload).subscribe({ next: () => { this.notify.success('Variant created'); this.form.reset(); this.load(); } }); }
  }

  remove(it: VariantDto){ if (!confirm(`Delete variant '${it.name}'?`)) return; this.api.deleteVariant(it.id).subscribe({ next: () => { this.notify.success('Variant deleted'); this.load(); } }); }
}
