import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FeatureEditDialogComponent } from './feature-edit-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { CatalogApiService, FeatureDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-features-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule, MatPaginatorModule, MatSortModule],
  templateUrl: './features.page.html',
  styles: [`
    .header { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
    .spacer { flex:1 1 auto; }
    .controls { display:flex; align-items:end; justify-content:space-between; gap:.75rem; margin-bottom:.75rem; }
    .controls-right { display:flex; align-items:end; }
    .search { width:320px; max-width:40vw; }
    table { width:100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name','description','actions'];
  readonly items$ = new BehaviorSubject<FeatureDto[]>([]);
  readonly total$ = new BehaviorSubject<number>(0);
  readonly page$ = new BehaviorSubject<number>(1);
  readonly pageSize$ = new BehaviorSubject<number>(10);
  readonly sort$ = new BehaviorSubject<{ active: string; direction: 'asc'|'desc' }>({ active: 'name', direction: 'asc' });
  // editing handled via dialog

  // page-level form removed; dialogs will handle validation
  readonly filter$ = new BehaviorSubject<string>('');
  readonly filtered$ = combineLatest([this.items$, this.filter$]).pipe(
    map(([items, q]) => {
      const query = q.toLowerCase().trim();
      if (!query) return items;
      return items.filter(it => (
        it.name.toLowerCase().includes(query) ||
        (it.description ?? '').toLowerCase().includes(query) ||
        String(it.id).includes(query)
      ));
    })
  );

  constructor(){ this.loadPage(); }
  private loadPage(){
    const sort = this.sort$.value;
    const page = this.page$.value;
    const pageSize = this.pageSize$.value;
    this.api.getFeaturesPaged({ page, pageSize, sort: sort.active, dir: sort.direction }).subscribe({
      next: (res) => { this.items$.next(res.items); this.total$.next(res.total); },
      error: () => this.notify.error('Failed to load features')
    });
  }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(FeatureEditDialogComponent, { data: { title: 'Add Feature' }, width: '400px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; description?: string } | undefined) => {
      if (res){
        this.api.createFeature(res).subscribe({ next: () => { this.notify.success('Feature created'); this.loadPage(); } });
      }
    });
  }

  openEdit(it: FeatureDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(FeatureEditDialogComponent, { data: { title: 'Edit Feature', name: it.name, description: it.description }, width: '400px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; description?: string } | undefined) => {
      if (res){
        this.api.updateFeature(it.id, res).subscribe({ next: () => { this.notify.success('Feature updated'); this.loadPage(); } });
      }
    });
  }

  remove(it: FeatureDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete feature '${it.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteFeature(it.id).subscribe({ next: () => { this.notify.success('Feature deleted'); this.loadPage(); } });
      }
    });
  }

  onFilterInput(val: string){ this.filter$.next(val); }
  onPageChange(ev: PageEvent){ this.page$.next(ev.pageIndex + 1); this.pageSize$.next(ev.pageSize); this.loadPage(); }
  onSortChange(ev: Sort){ const dir = (ev.direction || 'asc') as 'asc'|'desc'; const active = ev.active || 'name'; this.sort$.next({ active, direction: dir }); this.page$.next(1); this.loadPage(); }
}
