import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingsApiService, ListingDto } from './listings-api.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-listings-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatProgressBarModule],
  templateUrl: './listings-list.component.html'
})
export class ListingsListComponent {
  private api = inject(ListingsApiService);
  dataSource = new MatTableDataSource<ListingDto>([]);
  displayedColumns: string[] = ['title','make','model','generation','derivative','variant','body','transmission','fuel','price'];
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
}
