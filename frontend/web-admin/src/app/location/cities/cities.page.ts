import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocationApiService, CityDto, ProvinceDto } from '../location-api.service';
import { NotificationService } from '../../core/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { CityEditDialogComponent } from './city-edit-dialog.component';

@Component({
  selector: 'app-cities-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule, MatSelectModule, MatSortModule],
  templateUrl: './cities.page.html',
  styles: [`
    .header { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
    .spacer { flex:1 1 auto; }
    .controls { display:flex; align-items:end; justify-content:space-between; gap:.75rem; margin-bottom:.75rem; }
    .controls-right { display:flex; align-items:end; gap:.75rem; }
    .search { width:320px; max-width:40vw; }
    textarea.bulk { width:540px; min-height:96px; }
    table { width:100%; }
    .actions-cell { display:flex; align-items:center; gap:.25rem; white-space:nowrap; }
    tr.mat-row:hover { background: rgba(0,0,0,0.03); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CitiesPage {
  private readonly api = inject(LocationApiService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['province','city','code','slug','actions'];
  readonly cities$ = new BehaviorSubject<CityDto[]>([]);
  readonly provinces$ = new BehaviorSubject<ProvinceDto[]>([]);
  readonly filter$ = new BehaviorSubject<string>('');
  readonly selectedProvinceId$ = new BehaviorSubject<number | null>(null);
  readonly sort$ = new BehaviorSubject<{ active: string; direction: 'asc'|'desc' }>({ active: 'province', direction: 'asc' });
  readonly filtered$ = combineLatest([this.cities$, this.filter$, this.selectedProvinceId$, this.sort$]).pipe(
    map(([items, q, pid, sort]) => {
      let list = items;
      if (pid) list = list.filter(i => i.provinceId === pid);
      const query = q.toLowerCase().trim();
      if (query) list = list.filter(m => m.name.toLowerCase().includes(query) || (m.provinceName||'').toLowerCase().includes(query) || m.code.toLowerCase().includes(query));
      // client-side sort
      const dir = sort.direction === 'desc' ? -1 : 1;
      list = [...list].sort((a,b) => {
        const key = sort.active;
        const av = key === 'province' ? (a.provinceName||'') : key === 'city' ? a.name : key === 'code' ? a.code : '';
        const bv = key === 'province' ? (b.provinceName||'') : key === 'city' ? b.name : key === 'code' ? b.code : '';
        return av.localeCompare(bv) * dir;
      });
      return list;
    })
  );

  constructor(){ this.load(); }

  load(){
    // load provinces for filter and cities
    this.api.getProvinces({ page: 1, pageSize: 200 }).subscribe({ next: res => this.provinces$.next(res.items) });
    this.api.getCities({ page: 1, pageSize: 2000 }).subscribe({
      next: res => this.cities$.next(res.items),
      error: () => this.notify.error('Failed to load cities')
    });
  }

  onFilterInput(val: string){ this.filter$.next(val); }

  onProvinceFilterChange(id: number | null){ this.selectedProvinceId$.next(id ?? null); }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const provinces = this.provinces$.getValue();
    const ref = this.dialog.open(CityEditDialogComponent, { data: { title: 'Add City', provinces, isEdit: false }, width: '520px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; provinceId: number } | undefined) => {
      if (res){
        const names = res.name.split(',').map(x => x.trim()).filter(x => x);
        if (!names.length){ this.notify.error('Name is required'); return; }
        this.api.bulkCreateCities(names.join(','), res.provinceId).subscribe({
          next: r => { this.notify.success(`Created ${r.succeeded}, Failed ${r.failed}`); this.load(); },
          error: () => this.notify.error('Bulk create failed')
        });
      }
    });
  }

  openEdit(c: CityDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const provinces = this.provinces$.getValue();
    const ref = this.dialog.open(CityEditDialogComponent, { data: { title: 'Edit City', name: c.name, provinceId: c.provinceId, provinces, isEdit: true }, width: '520px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name?: string; provinceId?: number } | undefined) => {
      if (res){ this.api.updateCity(c.id, res).subscribe({ next: () => { this.notify.success('City updated'); this.load(); } }); }
    });
  }

  confirmDelete(c: CityDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete city '${c.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){ this.api.deleteCity(c.id).subscribe({ next: () => { this.notify.success('City deleted'); this.load(); }, error: err => this.notify.error(err?.error || 'Delete failed') }); }
    });
  }
  onSortChange(ev: Sort){ const dir = (ev.direction || 'asc') as 'asc'|'desc'; const active = ev.active || 'province'; this.sort$.next({ active, direction: dir }); }
}
