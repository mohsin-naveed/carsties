import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CatalogApiService, VariantFeatureDto, VariantDto, FeatureDto, GenerationDto, ModelDto, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-variant-features-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  templateUrl: './variant-features.page.html',
  styles:[`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
    table { width:100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VariantFeaturesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly displayedColumns = ['variant','feature','isStandard','actions'];

  readonly items$ = new BehaviorSubject<VariantFeatureDto[]>([]);
  readonly variants$ = new BehaviorSubject<VariantDto[]>([]);
  readonly generations$ = new BehaviorSubject<GenerationDto[]>([]);
  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly features$ = new BehaviorSubject<FeatureDto[]>([]);
  readonly variantGroups$ = combineLatest([this.variants$, this.generations$, this.models$, this.makes$]).pipe(
    map(([variants, generations, models, makes]) => {
      const groups: { label: string; variants: VariantDto[] }[] = [];
      for (const v of variants){
        const gen = generations.find(g => g.id === v.generationId);
        const model = gen ? models.find(m => m.id === gen.modelId) : undefined;
        const make = model ? makes.find(x => x.id === model.makeId) : undefined;
        const label = `${make?.name ?? 'Make'} / ${model?.name ?? 'Model'} / ${gen?.name ?? 'Gen'}`;
        groups.push({ label, variants: [v] });
      }
      return groups;
    })
  );

  readonly form = this.fb.nonNullable.group({
    variantId: [null as number | null, [Validators.required]],
    featureId: [null as number | null, [Validators.required]],
    isStandard: [true, [Validators.required]]
  });

  constructor(){
    this.api.getMakes().subscribe({ next: m => this.makes$.next(m), error: () => this.notify.error('Failed to load makes') });
    this.api.getModels().subscribe({ next: m => this.models$.next(m), error: () => this.notify.error('Failed to load models') });
    this.api.getGenerations().subscribe({ next: g => this.generations$.next(g), error: () => this.notify.error('Failed to load generations') });
    this.api.getVariants().subscribe({ next: v => this.variants$.next(v), error: () => this.notify.error('Failed to load variants') });
    this.api.getFeatures().subscribe({ next: f => this.features$.next(f), error: () => this.notify.error('Failed to load features') });
    this.load();
  }

  load(){ this.api.getVariantFeatures().subscribe({ next: data => this.items$.next(data), error: () => this.notify.error('Failed to load mappings') }); }

  lookupVariantName(id: number, variants: VariantDto[]){ return variants.find(v => v.id === id)?.name; }
  lookupFeatureName(id: number, features: FeatureDto[]){ return features.find(f => f.id === id)?.name; }

  onSubmit(){
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    if (val.variantId == null || val.featureId == null) return;
    this.api.createVariantFeature({ variantId: val.variantId, featureId: val.featureId, isStandard: val.isStandard })
      .subscribe({ next: () => { this.notify.success('Mapping created'); this.form.reset({ variantId: null, featureId: null, isStandard: true }); this.load(); } });
  }

  remove(it: VariantFeatureDto){
    if (!confirm('Delete mapping?')) return;
    this.api.deleteVariantFeature(it.variantId, it.featureId).subscribe({ next: () => { this.notify.success('Mapping deleted'); this.load(); } });
  }
}
