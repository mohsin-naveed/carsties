import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MakeEditDialogComponent } from './make-edit-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { CatalogApiService, MakeDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-makes-page',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule],
  template: `
    <section class="header">
      <h2>Makes</h2>
      <span class="spacer"></span>
      <button mat-flat-button color="primary" (click)="openCreate()">Add Make</button>
    </section>
    <mat-form-field appearance="outline" class="filter-field">
      <mat-label>Search</mat-label>
      <input matInput [value]="filter()" (input)="filter.set($any($event.target).value)" placeholder="Filter makes" />
    </mat-form-field>
    <table mat-table [dataSource]="dataFiltered" class="mat-elevation-z1">
      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef>#</th>
        <td mat-cell *matCellDef="let m">{{ m.id }}</td>
      </ng-container>
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let m">{{ m.name }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let m">
          <button mat-icon-button color="primary" (click)="openEdit(m)"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button color="warn" (click)="confirmDelete(m)"><mat-icon>delete</mat-icon></button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  `,
  styles: [`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .spacer { flex:1 1 auto; }
    .filter-field { margin-bottom:1rem; width:300px; display:block; }
    table { width:100%; }
  `]
})
export class MakesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['id','name','actions'];
  readonly makes = signal<MakeDto[]>([]);
  readonly filter = signal('');

  constructor(){ this.load(); }

  load(){
    this.api.getMakes().subscribe({
      next: data => this.makes.set(data),
      error: () => this.notify.error('Failed to load makes')
    });
  }

  get dataFiltered(){
    const q = this.filter().toLowerCase().trim();
    return q ? this.makes().filter(m => m.name.toLowerCase().includes(q)) : this.makes();
  }

  openCreate(){
    const ref = this.dialog.open(MakeEditDialogComponent, { data: { title: 'Add Make' }, width: '400px' });
    ref.afterClosed().subscribe((res: { name: string } | undefined) => {
      if (res){
        this.api.createMake(res).subscribe({ next: () => { this.notify.success('Make created'); this.load(); } });
      }
    });
  }

  openEdit(m: MakeDto){
    const ref = this.dialog.open(MakeEditDialogComponent, { data: { title: 'Edit Make', name: m.name }, width: '400px' });
    ref.afterClosed().subscribe((res: { name: string } | undefined) => {
      if (res){
        this.api.updateMake(m.id, res).subscribe({ next: () => { this.notify.success('Make updated'); this.load(); } });
      }
    });
  }

  confirmDelete(m: MakeDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete make '${m.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteMake(m.id).subscribe({ next: () => { this.notify.success('Make deleted'); this.load(); } });
      }
    });
  }
}
