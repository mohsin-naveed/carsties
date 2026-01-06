import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingsApiService, ListingDto } from './listings-api.service';

@Component({
  selector: 'app-listings-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './listings-list.component.html'
})
export class ListingsListComponent {
  private api = inject(ListingsApiService);
  items: ListingDto[] = [];
  loading = true;
  ngOnInit() {
    this.api.getListings().subscribe({
      next: x => { this.items = x; this.loading = false; },
      error: _ => { this.loading = false; }
    });
  }
}
