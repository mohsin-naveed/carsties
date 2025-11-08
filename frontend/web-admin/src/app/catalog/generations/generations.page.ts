import { Component, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-generations-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule],
  template: `
  <section class="header">
    <h2>Generations</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Model</mat-label>
        <mat-select formControlName="modelId">
          <mat-optgroup *ngFor="let group of makeGroups()" [label]="group.name">
            <mat-option *ngFor="let mdl of group.models" [value]="mdl.id">{{ mdl.name }}</mat-option>
          </mat-optgroup>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Start Year</mat-label>
        <input matInput type="number" formControlName="startYear">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>End Year</mat-label>
        <input matInput type="number" formControlName="endYear">
      </mat-form-field>
      <button mat-flat-button color="primary">{{ editingId() ? 'Update' : 'Add' }}</button>
      <button *ngIf="editingId()" mat-button type="button" (click)="cancelEdit()">Cancel</button>
    </form>
  </section>

  <table mat-table [dataSource]="items()" class="mat-elevation-z1">
    <ng-container matColumnDef="id">
      <th mat-header-cell *matHeaderCellDef>#</th>
      <td mat-cell *matCellDef="let it">{{ it.id }}</td>
    </ng-container>
    <ng-container matColumnDef="name">
      <th mat-header-cell *matHeaderCellDef>Name</th>
      <td mat-cell *matCellDef="let it">{{ it.name }}</td>
    </ng-container>
    <ng-container matColumnDef="model">
      <th mat-header-cell *matHeaderCellDef>Model</th>
      <td mat-cell *matCellDef="let it">{{ lookupModel(it.modelId)?.name }}</td>
    </ng-container>
    <ng-container matColumnDef="years">
      <th mat-header-cell *matHeaderCellDef>Years</th>
      <td mat-cell *matCellDef="let it">{{ it.startYear || '—' }} - {{ it.endYear || '—' }}</td>
    </ng-container>
    <ng-container matColumnDef="actions">
      <th mat-header-cell *matHeaderCellDef>Actions</th>
      <td mat-cell *matCellDef="let it">
        <button mat-icon-button color="primary" (click)="edit(it)"><mat-icon>edit</mat-icon></button>
        <button mat-icon-button color="warn" (click)="remove(it)"><mat-icon>delete</mat-icon></button>
      </td>
    </ng-container>
    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
  </table>
  `,
  styles: [`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; flex-wrap:wrap; }
    table { width:100%; }
  `]
})
export class GenerationsPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly displayedColumns = ['id','name','model','years','actions'];

  readonly items = signal<GenerationDto[]>([]);
  readonly models = signal<ModelDto[]>([]);
  readonly makes = signal<MakeDto[]>([]);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    modelId: [null as number | null, [Validators.required]],
    startYear: [null as number | null],
    endYear: [null as number | null]
  });

  constructor(){
  this.api.getMakes().subscribe({ next: ms => this.makes.set(ms), error: () => this.notify.error('Failed to load makes') });
  this.api.getModels().subscribe({ next: mdls => this.models.set(mdls), error: () => this.notify.error('Failed to load models') });
    this.load();
  }

  makeGroups(){
    return this.makes().map(m => ({ name: m.name, models: this.models().filter(md => md.makeId === m.id) }));
  }

  load(){ this.api.getGenerations().subscribe({ next: data => this.items.set(data), error: () => this.notify.error('Failed to load generations') }); }
  lookupModel(id: number){ return this.models().find(m => m.id === id); }

  edit(it: GenerationDto){
    this.editingId.set(it.id);
    this.form.patchValue({ name: it.name, modelId: it.modelId, startYear: it.startYear ?? null, endYear: it.endYear ?? null });
  }
  cancelEdit(){ this.editingId.set(null); this.form.reset(); }

  onSubmit(){
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const id = this.editingId();
    const payload = { name: val.name, modelId: val.modelId!, startYear: val.startYear ?? undefined, endYear: val.endYear ?? undefined };
    if (id){
  this.api.updateGeneration(id, payload).subscribe({ next: () => { this.notify.success('Generation updated'); this.cancelEdit(); this.load(); } });
    } else {
  this.api.createGeneration(payload).subscribe({ next: () => { this.notify.success('Generation created'); this.form.reset(); this.load(); } });
    }
  }

  remove(it: GenerationDto){ if (!confirm(`Delete generation '${it.name}'?`)) return; this.api.deleteGeneration(it.id).subscribe({ next: () => { this.notify.success('Generation deleted'); this.load(); } }); }
}
