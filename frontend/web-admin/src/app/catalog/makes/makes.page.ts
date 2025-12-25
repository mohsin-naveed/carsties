import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
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
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-makes-page',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule],
  templateUrl: './makes.page.html',
  styles: [`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .spacer { flex:1 1 auto; }
    .filter-field { margin-bottom:1rem; width:300px; display:block; }
    table { width:100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MakesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['make','model','actions'];
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.makes$, this.filter$]).pipe(
    map(([items, q]) => {
      const query = q.toLowerCase().trim();
      return query ? items.filter(m => m.name.toLowerCase().includes(query)) : items;
    })
  );

  constructor(){ this.load(); }

  load(){
    this.api.getMakes().subscribe({
      next: data => this.makes$.next(data),
      error: () => this.notify.error('Failed to load makes')
    });
  }

  onFilterInput(val: string){ this.filter$.next(val); }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(MakeEditDialogComponent, { data: { title: 'Add Make' }, width: '400px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string } | undefined) => {
      if (res){
        this.api.createMake(res).subscribe({ next: () => { this.notify.success('Make created'); this.load(); } });
      }
    });
  }

  openEdit(m: MakeDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(MakeEditDialogComponent, { data: { title: 'Edit Make', name: m.name }, width: '400px', autoFocus: true, restoreFocus: true });
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
