import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSortModule, Sort } from '@angular/material/sort';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocationApiService, ProvinceDto } from '../location-api.service';
import { NotificationService } from '../../core/notification.service';
import { ProvinceEditDialogComponent } from './province-edit-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-provinces-page',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule, MatSortModule],
  templateUrl: './provinces.page.html',
  styles: [`
    .header { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
    .spacer { flex:1 1 auto; }
    .controls { display:flex; align-items:end; justify-content:space-between; gap:.75rem; margin-bottom:.75rem; }
    .controls-right { display:flex; align-items:end; }
    .search { width:320px; max-width:40vw; }
    table { width:100%; }
    .actions-cell { display:flex; align-items:center; gap:.25rem; white-space:nowrap; }
    tr.mat-row:hover { background: rgba(0,0,0,0.03); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProvincesPage {
  private readonly api = inject(LocationApiService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name','code','actions'];
  readonly provinces$ = new BehaviorSubject<ProvinceDto[]>([]);
  readonly filter$ = new BehaviorSubject<string>('');
  readonly sort$ = new BehaviorSubject<{ active: string; direction: 'asc'|'desc' }>({ active: 'name', direction: 'asc' });
  readonly filtered$ = combineLatest([this.provinces$, this.filter$, this.sort$]).pipe(
    map(([items, q, sort]) => {
      const query = q.toLowerCase().trim();
      let list = query ? items.filter(m => m.name.toLowerCase().includes(query) || m.code.toLowerCase().includes(query)) : items;
      const dir = sort.direction === 'desc' ? -1 : 1;
      list = [...list].sort((a,b) => {
        const key = sort.active;
        const av = key === 'name' ? a.name : a.code;
        const bv = key === 'name' ? b.name : b.code;
        return av.localeCompare(bv) * dir;
      });
      return list;
    })
  );

  constructor(){ this.load(); }

  load(){
    this.api.getProvinces({ page: 1, pageSize: 500 }).subscribe({
      next: res => this.provinces$.next(res.items),
      error: () => this.notify.error('Failed to load provinces')
    });
  }

  onFilterInput(val: string){ this.filter$.next(val); }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(ProvinceEditDialogComponent, { data: { title: 'Add Province' }, width: '480px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string } | undefined) => {
      if (res){ this.api.createProvince(res).subscribe({ next: () => { this.notify.success('Province created'); this.load(); } }); }
    });
  }

  openEdit(p: ProvinceDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(ProvinceEditDialogComponent, { data: { title: 'Edit Province', name: p.name }, width: '480px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name?: string } | undefined) => {
      if (res){ this.api.updateProvince(p.id, res).subscribe({ next: () => { this.notify.success('Province updated'); this.load(); } }); }
    });
  }

  confirmDelete(p: ProvinceDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete province '${p.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){ this.api.deleteProvince(p.id).subscribe({ next: () => { this.notify.success('Province deleted'); this.load(); }, error: err => this.notify.error(err?.error || 'Delete failed') }); }
    });
  }

  onSortChange(ev: Sort){ const dir = (ev.direction || 'asc') as 'asc'|'desc'; const active = ev.active || 'name'; this.sort$.next({ active, direction: dir }); }
}
