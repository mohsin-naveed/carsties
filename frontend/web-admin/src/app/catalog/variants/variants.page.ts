import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VariantEditDialogComponent } from './variant-edit-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
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
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatDialogModule],
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
  private readonly dialog = inject(MatDialog);
  readonly displayedColumns = ['name','generation','engine','transmission','fuelType','actions'];

  readonly items$ = new BehaviorSubject<VariantDto[]>([]);
  readonly generations$ = new BehaviorSubject<GenerationDto[]>([]);
  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  // editing handled via dialog
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

  // page-level form removed; dialogs will handle validation

  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.items$, this.generations$, this.filter$]).pipe(
    map(([items, generations, q]) => {
      const query = q.toLowerCase().trim();
      if (!query) return items;
      const genMap = generations.reduce((acc, g) => { acc[g.id] = g; return acc; }, {} as Record<number, GenerationDto>);
      return items.filter(it => {
        const genName = genMap[it.generationId]?.name ?? '';
        return (
          it.name.toLowerCase().includes(query) ||
          genName.toLowerCase().includes(query) ||
          (it.engine ?? '').toLowerCase().includes(query) ||
          (it.transmission ?? '').toLowerCase().includes(query) ||
          (it.fuelType ?? '').toLowerCase().includes(query) ||
          String(it.id).includes(query)
        );
      });
    })
  );

  constructor(){
    this.api.getMakes().subscribe({ next: m => this.makes$.next(m), error: () => this.notify.error('Failed to load makes') });
    this.api.getModels().subscribe({ next: m => this.models$.next(m), error: () => this.notify.error('Failed to load models') });
    this.api.getGenerations().subscribe({ next: g => this.generations$.next(g), error: () => this.notify.error('Failed to load generations') });
    this.load();
  }

  load(){ this.api.getVariants().subscribe({ next: data => this.items$.next(data), error: () => this.notify.error('Failed to load variants') }); }
  lookupGeneration(id: number){ return undefined; }

  openCreate(generations: GenerationDto[]){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(VariantEditDialogComponent, { data: { title: 'Add Variant', generations }, width: '600px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; generationId: number; engine?: string; transmission?: string; fuelType?: string } | undefined) => {
      if (res){
        this.api.createVariant(res).subscribe({ next: () => { this.notify.success('Variant created'); this.load(); } });
      }
    });
  }

  openEdit(it: VariantDto, generations: GenerationDto[]){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(VariantEditDialogComponent, { data: { title: 'Edit Variant', name: it.name, generationId: it.generationId, engine: it.engine, transmission: it.transmission, fuelType: it.fuelType, generations }, width: '600px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; generationId: number; engine?: string; transmission?: string; fuelType?: string } | undefined) => {
      if (res){
        this.api.updateVariant(it.id, res).subscribe({ next: () => { this.notify.success('Variant updated'); this.load(); } });
      }
    });
  }

  remove(it: VariantDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete variant '${it.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteVariant(it.id).subscribe({ next: () => { this.notify.success('Variant deleted'); this.load(); } });
      }
    });
  }

  onFilterInput(val: string){ this.filter$.next(val); }
}
