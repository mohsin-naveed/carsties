import { Component, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-variants-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule],
  template: `
  <section class="header">
    <h2>Variants</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
      <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name"></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Generation</mat-label>
        <mat-select formControlName="generationId">
          <mat-optgroup *ngFor="let g of generationGroups()" [label]="g.label">
            <mat-option *ngFor="let gen of g.generations" [value]="gen.id">{{ gen.name }}</mat-option>
          </mat-optgroup>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Engine</mat-label><input matInput formControlName="engine"></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Transmission</mat-label><input matInput formControlName="transmission"></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Fuel</mat-label><input matInput formControlName="fuelType"></mat-form-field>
      <button mat-flat-button color="primary">{{ editingId() ? 'Update' : 'Add' }}</button>
      <button *ngIf="editingId()" mat-button type="button" (click)="cancelEdit()">Cancel</button>
    </form>
  </section>

  <table mat-table [dataSource]="items()" class="mat-elevation-z1">
    <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>#</th><td mat-cell *matCellDef="let it">{{ it.id }}</td></ng-container>
    <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let it">{{ it.name }}</td></ng-container>
    <ng-container matColumnDef="generation"><th mat-header-cell *matHeaderCellDef>Generation</th><td mat-cell *matCellDef="let it">{{ lookupGeneration(it.generationId)?.name }}</td></ng-container>
    <ng-container matColumnDef="engine"><th mat-header-cell *matHeaderCellDef>Engine</th><td mat-cell *matCellDef="let it">{{ it.engine }}</td></ng-container>
    <ng-container matColumnDef="transmission"><th mat-header-cell *matHeaderCellDef>Trans</th><td mat-cell *matCellDef="let it">{{ it.transmission }}</td></ng-container>
    <ng-container matColumnDef="fuelType"><th mat-header-cell *matHeaderCellDef>Fuel</th><td mat-cell *matCellDef="let it">{{ it.fuelType }}</td></ng-container>
    <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let it"><button mat-icon-button color="primary" (click)="edit(it)"><mat-icon>edit</mat-icon></button><button mat-icon-button color="warn" (click)="remove(it)"><mat-icon>delete</mat-icon></button></td></ng-container>
    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
  </table>
  `,
  styles:[`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
    table { width:100%; }
  `]
})
export class VariantsPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly displayedColumns = ['id','name','generation','engine','transmission','fuelType','actions'];

  readonly items = signal<VariantDto[]>([]);
  readonly generations = signal<GenerationDto[]>([]);
  readonly models = signal<ModelDto[]>([]);
  readonly makes = signal<MakeDto[]>([]);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    generationId: [null as number | null, [Validators.required]],
    engine: [''],
    transmission: [''],
    fuelType: ['']
  });

  constructor(){
  this.api.getMakes().subscribe({ next: m => this.makes.set(m), error: () => this.notify.error('Failed to load makes') });
  this.api.getModels().subscribe({ next: m => this.models.set(m), error: () => this.notify.error('Failed to load models') });
  this.api.getGenerations().subscribe({ next: g => this.generations.set(g), error: () => this.notify.error('Failed to load generations') });
    this.load();
  }

  generationGroups(){
    return this.generations().map(gen => {
      const model = this.models().find(m => m.id === gen.modelId);
      const make = model ? this.makes().find(x => x.id === model.makeId) : undefined;
      return { label: `${make?.name ?? 'Unknown'} / ${model?.name ?? 'Model'} (${gen.name})`, generations: [gen] };
    });
  }

  load(){ this.api.getVariants().subscribe({ next: data => this.items.set(data), error: () => this.notify.error('Failed to load variants') }); }
  lookupGeneration(id: number){ return this.generations().find(g => g.id === id); }

  edit(it: VariantDto){ this.editingId.set(it.id); this.form.patchValue({ name: it.name, generationId: it.generationId, engine: it.engine || '', transmission: it.transmission || '', fuelType: it.fuelType || '' }); }
  cancelEdit(){ this.editingId.set(null); this.form.reset(); }

  onSubmit(){
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const id = this.editingId();
    const payload = { name: val.name, generationId: val.generationId!, engine: val.engine || undefined, transmission: val.transmission || undefined, fuelType: val.fuelType || undefined };
  if (id){ this.api.updateVariant(id, payload).subscribe({ next: () => { this.notify.success('Variant updated'); this.cancelEdit(); this.load(); } }); }
  else { this.api.createVariant(payload).subscribe({ next: () => { this.notify.success('Variant created'); this.form.reset(); this.load(); } }); }
  }

  remove(it: VariantDto){ if (!confirm(`Delete variant '${it.name}'?`)) return; this.api.deleteVariant(it.id).subscribe({ next: () => { this.notify.success('Variant deleted'); this.load(); } }); }
}
