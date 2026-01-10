import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ListingsApiService, ListingDto } from './listings-api.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, RouterModule],
  templateUrl: './listing-detail.component.html',
  styleUrls: ['./listing-detail.component.scss']
})
export class ListingDetailComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ListingsApiService);

  listing = signal<ListingDto | null>(null);
  loading = signal<boolean>(true);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.loading.set(false); return; }
    this.api.getListing(id).subscribe({
      next: x => { this.listing.set(x); this.loading.set(false); },
      error: _ => { this.loading.set(false); }
    });
  }
}
