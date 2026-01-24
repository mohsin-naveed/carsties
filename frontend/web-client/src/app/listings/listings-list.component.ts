import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingsApiService, ListingDto } from './listings-api.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-listings-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatProgressBarModule, MatIconModule, MatDialogModule, MatButtonModule, ConfirmDialogComponent, RouterModule],
  templateUrl: './listings-list.component.html'
})
export class ListingsListComponent {
  private api = inject(ListingsApiService);
  private dialog = inject(MatDialog);
  dataSource = new MatTableDataSource<ListingDto>([]);
  displayedColumns: string[] = ['title','make','model','generation','derivative','variant','body','transmission','fuel','price','actions'];
  loading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  ngOnInit() {
    this.api.getListings().subscribe({
      next: x => { this.dataSource.data = x; this.loading = false; this.attachTableFeatures(); },
      error: _ => { this.loading = false; }
    });
  }

  attachTableFeatures() {
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
  }

  onDelete(l: ListingDto) {
    const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete listing '${l.title}'?` } });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.api.deleteListing(l.id).subscribe({ next: () => { this.dataSource.data = this.dataSource.data.filter(x => x.id !== l.id); }, error: () => {} });
    });
  }
}
