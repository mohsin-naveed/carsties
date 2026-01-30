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
import { LocationApiService, AreaDto, CityDto, ProvinceDto } from '../location-api.service';
import { NotificationService } from '../../core/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { AreaEditDialogComponent } from './area-edit-dialog.component';

@Component({
  selector: 'app-areas-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule, MatSelectModule, MatSortModule],
  templateUrl: './areas.page.html',
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
export class AreasPage {
  private readonly api = inject(LocationApiService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['province','city','area','code','slug','actions'];
  readonly areas$ = new BehaviorSubject<AreaDto[]>([]);
  readonly provinces$ = new BehaviorSubject<ProvinceDto[]>([]);
  readonly cities$ = new BehaviorSubject<CityDto[]>([]);
  readonly filter$ = new BehaviorSubject<string>('');
  readonly selectedProvinceId$ = new BehaviorSubject<number | null>(null);
  readonly selectedCityId$ = new BehaviorSubject<number | null>(null);
  readonly sort$ = new BehaviorSubject<{ active: string; direction: 'asc'|'desc' }>({ active: 'province', direction: 'asc' });

  // View model enriched with province info from the city
  private readonly joined$ = combineLatest([this.areas$, this.cities$]).pipe(
    map(([areas, cities]) => areas.map(a => {
      const city = cities.find(c => c.id === a.cityId);
      return { ...a, cityName: a.cityName ?? city?.name, provinceId: city?.provinceId, provinceName: city?.provinceName } as AreaDto & { provinceId?: number; provinceName?: string; };
    }))
  );

  readonly filtered$ = combineLatest([this.joined$, this.filter$, this.selectedProvinceId$, this.selectedCityId$, this.sort$]).pipe(
    map(([items, q, pid, cid, sort]) => {
      let list = items;
      if (pid) list = list.filter(i => i.provinceId === pid);
      if (cid) list = list.filter(i => i.cityId === cid);
      const query = q.toLowerCase().trim();
      if (query) list = list.filter(m => m.name.toLowerCase().includes(query) || (m.cityName||'').toLowerCase().includes(query) || (m.provinceName||'').toLowerCase().includes(query) || m.code.toLowerCase().includes(query));
      const dir = sort.direction === 'desc' ? -1 : 1;
      list = [...list].sort((a,b) => {
        const key = sort.active;
        const av = key === 'province' ? (a.provinceName||'') : key === 'city' ? (a.cityName||'') : key === 'area' ? a.name : key === 'code' ? a.code : '';
        const bv = key === 'province' ? (b.provinceName||'') : key === 'city' ? (b.cityName||'') : key === 'area' ? b.name : key === 'code' ? b.code : '';
        return av.localeCompare(bv) * dir;
      });
      return list;
    })
  );
  readonly filteredCitiesForProvince$ = combineLatest([this.cities$, this.selectedProvinceId$]).pipe(
    map(([cities, pid]) => pid ? cities.filter(c => c.provinceId === pid) : cities)
  );

  constructor(){ this.load(); }

  load(){
    this.api.getProvinces({ page: 1, pageSize: 200 }).subscribe({ next: res => this.provinces$.next(res.items) });
    this.api.getCities({ page: 1, pageSize: 2000 }).subscribe({ next: res => this.cities$.next(res.items) });
    this.api.getAreas({ page: 1, pageSize: 2000 }).subscribe({
      next: res => this.areas$.next(res.items),
      error: () => this.notify.error('Failed to load areas')
    });
  }

  onFilterInput(val: string){ this.filter$.next(val); }

  onProvinceFilterChange(id: number | null){ this.selectedProvinceId$.next(id ?? null); this.selectedCityId$.next(null); }
  onCityFilterChange(id: number | null){ this.selectedCityId$.next(id ?? null); }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(AreaEditDialogComponent, { data: { title: 'Add Area' }, width: '520px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; cityId: number; latitude?: number; longitude?: number } | undefined) => {
      if (res){
        const names = res.name.split(',').map(x => x.trim()).filter(x => x);
        const unique = names.filter((v,i,a)=>a.findIndex(z=>z.toLowerCase()===v.toLowerCase())===i);
        let created = 0, failed = 0;
        const next = () => { this.notify.success(`Created ${created}, Failed ${failed}`); this.load(); };
        if (!unique.length){ this.notify.error('Name is required'); return; }
        let remaining = unique.length;
        unique.forEach(n => {
          this.api.createArea({ name: n, cityId: res.cityId, latitude: res.latitude, longitude: res.longitude }).subscribe({
            next: () => { created++; if (--remaining === 0) next(); },
            error: () => { failed++; if (--remaining === 0) next(); }
          });
        });
      }
    });
  }

  openEdit(a: AreaDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(AreaEditDialogComponent, { data: { title: 'Edit Area', name: a.name, cityId: a.cityId, latitude: a.latitude, longitude: a.longitude }, width: '520px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name?: string; cityId?: number; latitude?: number; longitude?: number } | undefined) => {
      if (res){ this.api.updateArea(a.id, res).subscribe({ next: () => { this.notify.success('Area updated'); this.load(); } }); }
    });
  }

  confirmDelete(a: AreaDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete area '${a.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){ this.api.deleteArea(a.id).subscribe({ next: () => { this.notify.success('Area deleted'); this.load(); }, error: err => this.notify.error(err?.error || 'Delete failed') }); }
    });
  }
  onSortChange(ev: Sort){ const dir = (ev.direction || 'asc') as 'asc'|'desc'; const active = ev.active || 'province'; this.sort$.next({ active, direction: dir }); }
}
