import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VariantFeatureEditDialogComponent } from './variant-feature-edit-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
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
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatDialogModule],
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
  private readonly dialog = inject(MatDialog);
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

  // page-level form removed; dialogs will handle validation

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

  openCreate(variants: VariantDto[], features: FeatureDto[]){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(VariantFeatureEditDialogComponent, { data: { title: 'Add Mapping', variants, features }, width: '560px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { variantId: number; featureId: number; isStandard: boolean } | undefined) => {
      if (res){
        this.api.createVariantFeature(res).subscribe({ next: () => { this.notify.success('Mapping created'); this.load(); } });
      }
    });
  }

  openEdit(it: VariantFeatureDto, variants: VariantDto[], features: FeatureDto[]){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(VariantFeatureEditDialogComponent, { data: { title: 'Edit Mapping', variantId: it.variantId, featureId: it.featureId, isStandard: it.isStandard, variants, features }, width: '560px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { variantId: number; featureId: number; isStandard: boolean } | undefined) => {
      if (res){
        this.api.updateVariantFeature(it.variantId, it.featureId, { isStandard: res.isStandard }).subscribe({ next: () => { this.notify.success('Mapping updated'); this.load(); } });
      }
    });
  }

  remove(it: VariantFeatureDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: 'Delete mapping?' } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteVariantFeature(it.variantId, it.featureId).subscribe({ next: () => { this.notify.success('Mapping deleted'); this.load(); } });
      }
    });
  }
}
