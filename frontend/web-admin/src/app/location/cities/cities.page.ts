import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocationApiService, CityDto, ProvinceDto } from '../location-api.service';
import { NotificationService } from '../../core/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { CityEditDialogComponent } from './city-edit-dialog.component';

@Component({
  selector: 'app-cities-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule],
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

  readonly displayedColumns = ['city','province','code','slug','actions'];
  readonly cities$ = new BehaviorSubject<CityDto[]>([]);
  readonly provinces$ = new BehaviorSubject<ProvinceDto[]>([]);
  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.cities$, this.filter$]).pipe(
    map(([items, q]) => {
      const query = q.toLowerCase().trim();
      return query ? items.filter(m => m.name.toLowerCase().includes(query) || (m.provinceName||'').toLowerCase().includes(query)) : items;
    })
  );

  bulkProvinceId: number | null = null;
  bulkNames = '';
  previewNames: string[] = [];

  constructor(){ this.load(); }

  load(){
    // load provinces for bulk target and filter
    this.api.getProvinces({ page: 1, pageSize: 200 }).subscribe({ next: res => this.provinces$.next(res.items) });
    this.api.getCities({ page: 1, pageSize: 1000 }).subscribe({
      next: res => this.cities$.next(res.items),
      error: () => this.notify.error('Failed to load cities')
    });
  }

  onFilterInput(val: string){ this.filter$.next(val); }

  parsePreview(){
    const names = (this.bulkNames||'').split(',').map(x => x.trim()).filter(x => x).filter((v,i,a)=>a.findIndex(z=>z.toLowerCase()===v.toLowerCase())===i);
    this.previewNames = names;
  }

  doBulkCreate(){
    if (!this.bulkProvinceId){ this.notify.error('Select a province'); return; }
    if (!this.previewNames.length){ this.notify.error('Enter comma-separated names'); return; }
    this.api.bulkCreateCities(this.previewNames.join(','), this.bulkProvinceId).subscribe({
      next: res => {
        const msg = `Created ${res.succeeded}, Failed ${res.failed}`;
        this.notify.success(msg);
        this.load();
      },
      error: () => this.notify.error('Bulk create failed')
    });
  }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(CityEditDialogComponent, { data: { title: 'Add City' }, width: '520px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; provinceId: number } | undefined) => {
      if (res){ this.api.createCity(res).subscribe({ next: () => { this.notify.success('City created'); this.load(); } }); }
    });
  }

  openEdit(c: CityDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(CityEditDialogComponent, { data: { title: 'Edit City', name: c.name, provinceId: c.provinceId }, width: '520px', autoFocus: true, restoreFocus: true });
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
}
