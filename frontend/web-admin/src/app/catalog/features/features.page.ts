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
import { CatalogApiService, FeatureDto } from '../catalog-api.service';
import { NotificationService } from '../../core/notification.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-features-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule],
  templateUrl: './features.page.html',
  styles: [`
    .header { display:flex; align-items:center; gap:1rem; justify-content:space-between; margin-bottom:1rem; }
    .form { display:flex; align-items:end; gap:.75rem; }
    table { width:100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturesPage {
  private readonly api = inject(CatalogApiService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['id','name','description','actions'];
  readonly items$ = new BehaviorSubject<FeatureDto[]>([]);
  // editing handled via dialog

  // page-level form removed; dialogs will handle validation

  constructor(){ this.load(); }
  load(){ this.api.getFeatures().subscribe({ next: data => this.items$.next(data), error: () => this.notify.error('Failed to load features') }); }

  openCreate(){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(FeatureEditDialogComponent, { data: { title: 'Add Feature' }, width: '400px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; description?: string } | undefined) => {
      if (res){
        this.api.createFeature(res).subscribe({ next: () => { this.notify.success('Feature created'); this.load(); } });
      }
    });
  }

  openEdit(it: FeatureDto){
    (document.activeElement as HTMLElement | null)?.blur();
    const ref = this.dialog.open(FeatureEditDialogComponent, { data: { title: 'Edit Feature', name: it.name, description: it.description }, width: '400px', autoFocus: true, restoreFocus: true });
    ref.afterClosed().subscribe((res: { name: string; description?: string } | undefined) => {
      if (res){
        this.api.updateFeature(it.id, res).subscribe({ next: () => { this.notify.success('Feature updated'); this.load(); } });
      }
    });
  }

  remove(it: FeatureDto){
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete feature '${it.name}'?` } });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok){
        this.api.deleteFeature(it.id).subscribe({ next: () => { this.notify.success('Feature deleted'); this.load(); } });
      }
    });
  }
}
