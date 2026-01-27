import { Component, inject, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ListingsApiService, ListingDto, PaginationResponse } from '../listings/listings-api.service';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-listings-carousel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './listings-carousel.component.html',
  styleUrls: ['./listings-carousel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingsCarouselComponent implements AfterViewInit {
  private readonly api = inject(ListingsApiService);
  private readonly router = inject(Router);
  @ViewChild('track', { static: true }) track!: ElementRef<HTMLDivElement>;

  readonly response$ = this.api.searchListings({ page: 1, pageSize: 12, sortBy: 'year', sortDirection: 'desc' }).pipe(shareReplay(1));
  readonly listings$ = this.response$.pipe(map((r: PaginationResponse<ListingDto>) => r.data));

  ngAfterViewInit() {}

  navigateTo(listing: ListingDto) { this.router.navigate(['/listings', listing.id]); }
  scrollLeft() { const el = this.track?.nativeElement; if (!el) return; el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' }); }
  scrollRight() { const el = this.track?.nativeElement; if (!el) return; el.scrollBy({ left: el.clientWidth, behavior: 'smooth' }); }
}
