import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CatalogApiService, FeatureDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-features-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
  <section class="header">
    <h2>Features</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Description</mat-label>
        <input matInput formControlName="description">
      </mat-form-field>
      <button mat-flat-button color="primary" type="submit">{{ editingId() ? 'Update' : 'Add' }}</button>
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
    <ng-container matColumnDef="description">
      <th mat-header-cell *matHeaderCellDef>Description</th>
      <td mat-cell *matCellDef="let it">{{ it.description }}</td>
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
    .form { display:flex; align-items:end; gap:.75rem; }
    table { width:100%; }
  `]
})
export class FeaturesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['id','name','description','actions'];
  readonly items = signal<FeatureDto[]>([]);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['']
  });

  constructor(){ this.load(); }
  load(){ this.api.getFeatures().subscribe({ next: data => this.items.set(data), error: () => this.notify.error('Failed to load features') }); }

  edit(it: FeatureDto){ this.editingId.set(it.id); this.form.patchValue({ name: it.name, description: it.description || '' }); }
  cancelEdit(){ this.editingId.set(null); this.form.reset(); }

  onSubmit(){
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const id = this.editingId();
    if (id){
      this.api.updateFeature(id, { name: val.name, description: val.description }).subscribe({ next: () => { this.notify.success('Feature updated'); this.cancelEdit(); this.load(); } });
    } else {
      this.api.createFeature({ name: val.name, description: val.description }).subscribe({ next: () => { this.notify.success('Feature created'); this.form.reset(); this.load(); } });
    }
  }

  remove(it: FeatureDto){ if (!confirm(`Delete feature '${it.name}'?`)) return; this.api.deleteFeature(it.id).subscribe({ next: () => { this.notify.success('Feature deleted'); this.load(); } }); }
}
