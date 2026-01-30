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
import { LocationApiService, AreaDto, CityDto } from '../location-api.service';
import { NotificationService } from '../../core/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { AreaEditDialogComponent } from './area-edit-dialog.component';

@Component({
  selector: 'app-areas-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule],
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

  readonly displayedColumns = ['area','city','code','slug','actions'];
  readonly areas$ = new BehaviorSubject<AreaDto[]>([]);
  readonly cities$ = new BehaviorSubject<CityDto[]>([]);
  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.areas$, this.filter$]).pipe(
    map(([items, q]) => {
      const query = q.toLowerCase().trim();
      return query ? items.filter(m => m.name.toLowerCase().includes(query) || (m.cityName||'').toLowerCase().includes(query)) : items;
    })
  );

  bulkCityId: number | null = null;
  bulkNames = '';
  previewNames: string[] = [];

  constructor(){ this.load(); }

  load(){
    this.api.getCities({ page: 1, pageSize: 1000 }).subscribe({ next: res => this.cities$.next(res.items) });
    this.api.getAreas({ page: 1, pageSize: 2000 }).subscribe({
      next: res => this.areas$.next(res.items),
      error: () => this.notify.error('Failed to load areas')
    });
  }

  onFilterInput(val: string){ this.filter$.next(val); }

  parsePreview(){
    const names = (this.bulkNames||'').split(',').map(x => x.trim()).filter(x => x).filter((v,i,a)=>a.findIndex(z=>z.toLowerCase()===v.toLowerCase())===i);
    this.previewNames = names;
  }

  doBulkCreate(){
    if (!this.bulkCityId){ this.notify.error('Select a city'); return; }
    if (!this.previewNames.length){ this.notify.error('Enter comma-separated names'); return; }
    this.api.bulkCreateAreas(this.previewNames.join(','), this.bulkCityId).subscribe({
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
    const ref = this.dialog.open(AreaEditDialogComponent, { data: { title: 'Add Area' }, width: '520px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; cityId: number; latitude?: number; longitude?: number } | undefined) => {
      if (res){ this.api.createArea(res).subscribe({ next: () => { this.notify.success('Area created'); this.load(); } }); }
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
}
