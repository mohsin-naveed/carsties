import { Component, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-models-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule],
  template: `
  <section class="header">
    <h2>Models</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Make</mat-label>
        <mat-select formControlName="makeId">
          <mat-option *ngFor="let m of makes()" [value]="m.id">{{ m.name }}</mat-option>
        </mat-select>
      </mat-form-field>
      <button mat-flat-button color="primary">{{ editingId() ? 'Update' : 'Add' }}</button>
      <button *ngIf="editingId()" mat-button type="button" (click)="cancelEdit()">Cancel</button>
    </form>
  </section>

  <table mat-table [dataSource]="models()" class="mat-elevation-z1">
    <ng-container matColumnDef="id">
      <th mat-header-cell *matHeaderCellDef>#</th>
      <td mat-cell *matCellDef="let it">{{ it.id }}</td>
    </ng-container>
    <ng-container matColumnDef="name">
      <th mat-header-cell *matHeaderCellDef>Name</th>
      <td mat-cell *matCellDef="let it">{{ it.name }}</td>
    </ng-container>
    <ng-container matColumnDef="make">
      <th mat-header-cell *matHeaderCellDef>Make</th>
      <td mat-cell *matCellDef="let it">{{ lookupMake(it.makeId)?.name }}</td>
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
export class ModelsPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly displayedColumns = ['id','name','make','actions'];

  readonly models = signal<ModelDto[]>([]);
  readonly makes = signal<MakeDto[]>([]);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    makeId: [null as number | null, [Validators.required]]
  });

  constructor(){
    this.loadMakes();
    this.loadModels();
  }

  loadMakes(){ this.api.getMakes().subscribe(data => this.makes.set(data)); }
  loadModels(){ this.api.getModels().subscribe({ next: data => this.models.set(data), error: () => this.notify.error('Failed to load models') }); }

  lookupMake(id: number){ return this.makes().find(m => m.id === id); }

  edit(it: ModelDto){
    this.editingId.set(it.id);
    this.form.patchValue({ name: it.name, makeId: it.makeId });
  }
  cancelEdit(){ this.editingId.set(null); this.form.reset(); }

  onSubmit(){
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const id = this.editingId();
    if (id){
  this.api.updateModel(id, { name: val.name, makeId: val.makeId || undefined }).subscribe({ next: () => { this.notify.success('Model updated'); this.cancelEdit(); this.loadModels(); } });
    } else {
      if (val.makeId == null) return;
  this.api.createModel({ name: val.name, makeId: val.makeId }).subscribe({ next: () => { this.notify.success('Model created'); this.form.reset(); this.loadModels(); } });
    }
  }

  remove(it: ModelDto){ if (!confirm(`Delete model '${it.name}'?`)) return; this.api.deleteModel(it.id).subscribe({ next: () => { this.notify.success('Model deleted'); this.loadModels(); } }); }
}
