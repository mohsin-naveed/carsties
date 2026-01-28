import { Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ListingsApiService, ListingDto, PaginationResponse } from '../listings/listings-api.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-featured-listings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './featured-listings.component.html',
  styleUrls: ['./featured-listings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturedListingsComponent implements AfterViewInit {
  private readonly api = inject(ListingsApiService);
  private readonly router = inject(Router);
  @ViewChild('track', { static: false }) track!: ElementRef<HTMLDivElement>;

  readonly loading$ = new BehaviorSubject<boolean>(true);
  readonly error$ = new BehaviorSubject<string | null>(null);

  readonly response$: Observable<PaginationResponse<ListingDto>> = this.api
    .searchListings({ page: 1, pageSize: 8, sortBy: 'year', sortDirection: 'desc' })
    .pipe(
      map(r => r),
      shareReplay(1),
      catchError(err => {
        this.error$.next('Failed to load featured listings');
        throw err;
      })
    );

  readonly listings$ = this.response$.pipe(map(r => r.data));

  navigateTo(listing: ListingDto) {
    this.router.navigate(['/listings', listing.id]);
  }

  // Simple per-card carousel state by listing id
  private readonly indices = new Map<number, number>();
  currentIndex(l: ListingDto): number { return this.indices.get(l.id) ?? 0; }
  next(l: ListingDto) {
    const imgs = l.images ?? [];
    if (!imgs.length) return;
    const i = (this.currentIndex(l) + 1) % imgs.length;
    this.indices.set(l.id, i);
  }
  prev(l: ListingDto) {
    const imgs = l.images ?? [];
    if (!imgs.length) return;
    const i = (this.currentIndex(l) - 1 + imgs.length) % imgs.length;
    this.indices.set(l.id, i);
  }

  ngAfterViewInit() {}

  scrollLeft() { const el = this.track?.nativeElement; if (!el) return; el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' }); }
  scrollRight() { const el = this.track?.nativeElement; if (!el) return; el.scrollBy({ left: el.clientWidth, behavior: 'smooth' }); }
}
