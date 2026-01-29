import { Component, inject, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingsApiService, ListingDto, PaginationResponse } from '../listings/listings-api.service';
import { BehaviorSubject, combineLatest, forkJoin, of } from 'rxjs';
import { map, switchMap, shareReplay, distinctUntilChanged, debounceTime, catchError, startWith, tap, take } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Chip model for active filters
interface ActiveFilterChip { kind: 'make'|'model'|'transmission'|'body'|'fuel'|'seats'|'doors'; code?: string; value?: number; label: string }

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatCardModule, MatProgressBarModule, RouterModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent {
  private readonly api = inject(ListingsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private seedingFromUrl = false;
  private hasSeeded = false;

  // Sorting options (used in template)
  readonly sortOptions = [
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Year: Newest', value: 'year-desc' },
    { label: 'Year: Oldest', value: 'year-asc' }
  ];

  // Filter subjects
  readonly selectedMakeCodes$ = new BehaviorSubject<string[]>([]);
  readonly selectedModelCodes$ = new BehaviorSubject<string[]>([]);
  readonly selectedTransmissionCodes$ = new BehaviorSubject<string[]>([]);
  readonly selectedBodyTypeCodes$ = new BehaviorSubject<string[]>([]);
  readonly selectedFuelTypeCodes$ = new BehaviorSubject<string[]>([]);
  readonly selectedSeats$ = new BehaviorSubject<number[]>([]);
  readonly selectedDoors$ = new BehaviorSubject<number[]>([]);

  // Range filters
  readonly priceMin$ = new BehaviorSubject<number | undefined>(undefined);
  readonly priceMax$ = new BehaviorSubject<number | undefined>(undefined);
  readonly yearMin$ = new BehaviorSubject<number | undefined>(undefined);
  readonly yearMax$ = new BehaviorSubject<number | undefined>(undefined);
  readonly mileageMin$ = new BehaviorSubject<number | undefined>(undefined);
  readonly mileageMax$ = new BehaviorSubject<number | undefined>(undefined);

  // Year dropdown options (1980..current)
  readonly yearStart = 1980;
  readonly yearEnd = new Date().getFullYear();
  readonly yearOptionsAsc = Array.from({ length: (this.yearEnd - this.yearStart + 1) }, (_, i) => this.yearStart + i);
  readonly yearOptionsDesc = [...this.yearOptionsAsc].reverse();

  // Sorting & pagination subjects
  readonly sort$ = new BehaviorSubject<string>('price-asc');
  readonly page$ = new BehaviorSubject<number>(1);
  readonly pageSize$ = new BehaviorSubject<number>(12);

  // Loading indicator
  readonly loading$ = new BehaviorSubject<boolean>(true);
  // UI state: grid/list view and mobile filters visibility
  readonly view$ = new BehaviorSubject<'grid'|'list'>('grid');
  readonly filtersVisible$ = new BehaviorSubject<boolean>(false);
  readonly mobileSortOpen$ = new BehaviorSubject<boolean>(false);

  // Reference data derived from ListingService facet labels (no Catalog dependency)
  // Facet params and counts (base stream used throughout)
  private readonly facetParams$ = combineLatest([
    this.selectedMakeCodes$,
    this.selectedModelCodes$,
    this.selectedTransmissionCodes$,
    this.selectedBodyTypeCodes$,
    this.selectedFuelTypeCodes$,
    this.selectedSeats$,
    this.selectedDoors$,
    this.priceMin$,
    this.priceMax$,
    this.yearMin$,
    this.yearMax$,
    this.mileageMin$,
    this.mileageMax$
  ]).pipe(
    debounceTime(100),
    map(([makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax]) => ({ makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax })),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay(1)
  );

  private mapFacetDto(dto: any) {
    return {
      makes: new Map<string, number>(Object.entries(dto.makes).map(([k,v]) => [String(k), v as number])),
      models: new Map<string, number>(Object.entries(dto.models).map(([k,v]) => [String(k), v as number])),
      transmissions: new Map<string, number>(Object.entries(dto.transmissions).map(([k,v]) => [String(k), v as number])),
      bodies: new Map<string, number>(Object.entries(dto.bodies).map(([k,v]) => [String(k), v as number])),
      fuels: new Map<string, number>(Object.entries(dto.fuels).map(([k,v]) => [String(k), v as number])),
      seats: new Map<number, number>(Object.entries(dto.seats ?? {}).map(([k,v]) => [Number(k), v as number])),
      doors: new Map<number, number>(Object.entries(dto.doors ?? {}).map(([k,v]) => [Number(k), v as number])),
      years: new Map<number, number>(Object.entries(dto.years).map(([k,v]) => [Number(k), v as number])),
      prices: new Map<number, number>(Object.entries(dto.prices).map(([k,v]) => [Number(k), v as number])),
      mileages: new Map<number, number>(Object.entries(dto.mileages).map(([k,v]) => [Number(k), v as number])),
      priceStep: dto.priceStep,
      mileageStep: dto.mileageStep,
      minMileage: dto.minMileage,
      mileageExact: new Map<number, number>(Object.entries(dto.mileageExact ?? {}).map(([k,v]) => [Number(k), v as number])),
      // Labels
      makeLabels: new Map<string, string>(Object.entries(dto.makeLabels ?? {}).map(([k,v]) => [String(k), String(v)])),
      modelLabels: new Map<string, string>(Object.entries(dto.modelLabels ?? {}).map(([k,v]) => [String(k), String(v)])),
      modelMakeCodes: new Map<string, string>(Object.entries(dto.modelMakeCodes ?? {}).map(([k,v]) => [String(k), String(v)])),
      transmissionLabels: new Map<string, string>(Object.entries(dto.transmissionLabels ?? {}).map(([k,v]) => [String(k), String(v)])),
      bodyLabels: new Map<string, string>(Object.entries(dto.bodyLabels ?? {}).map(([k,v]) => [String(k), String(v)])),
      fuelLabels: new Map<string, string>(Object.entries(dto.fuelLabels ?? {}).map(([k,v]) => [String(k), String(v)]))
    } as const;
  }

  // Facet counts & labels from ListingService (single call shared)
  private readonly facetCounts$ = this.facetParams$.pipe(
    switchMap(params => this.api.getFacetCounts(params)),
    map(dto => this.mapFacetDto(dto)),
    shareReplay(1)
  );

  // Build options arrays from label maps
  private readonly makesAll$ = this.facetCounts$.pipe(
    map(fc => Array.from((fc.makeLabels ?? new Map<string, string>()).entries()).map(([code, name]) => ({ code, name }))),
    shareReplay(1)
  );
  private readonly allTransmissions$ = this.facetCounts$.pipe(
    map(fc => Array.from((fc.transmissionLabels ?? new Map<string, string>()).entries()).map(([code, name]) => ({ code, name }))),
    shareReplay(1)
  );
  private readonly allBodyTypes$ = this.facetCounts$.pipe(
    map(fc => Array.from((fc.bodyLabels ?? new Map<string, string>()).entries()).map(([code, name]) => ({ code, name }))),
    shareReplay(1)
  );
  private readonly allFuelTypes$ = this.facetCounts$.pipe(
    map(fc => Array.from((fc.fuelLabels ?? new Map<string, string>()).entries()).map(([code, name]) => ({ code, name }))),
    shareReplay(1)
  );
  private readonly modelsAll$ = this.facetCounts$.pipe(
    map(fc => {
      const names = fc.modelLabels ?? new Map<string, string>();
      const parent = fc.modelMakeCodes ?? new Map<string, string>();
      return Array.from(names.entries()).map(([code, name]) => ({ code, name, makeCode: parent.get(code) ?? '' }));
    }),
    shareReplay(1)
  );
  // Models depend on selected make
  readonly models$ = combineLatest([this.modelsAll$, this.selectedMakeCodes$]).pipe(
    map(([all, codes]) => codes.length ? all.filter(m => codes.includes(m.makeCode)) : all),
    shareReplay(1)
  );

  // Variants filter removed

  // Query params stream
  private readonly query$ = combineLatest([
    this.selectedMakeCodes$,
    this.selectedModelCodes$,
    this.selectedTransmissionCodes$,
    this.selectedBodyTypeCodes$,
    this.selectedFuelTypeCodes$,
    this.selectedSeats$,
    this.selectedDoors$,
    this.priceMin$,
    this.priceMax$,
    this.yearMin$,
    this.yearMax$,
    this.mileageMin$,
    this.mileageMax$,
    this.sort$,
    this.page$,
    this.pageSize$
  ]).pipe(
    debounceTime(100),
    map(([makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, sort, page, pageSize]) => ({ makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, sort, page, pageSize })),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay(1)
  );

  // Results stream
  readonly results$ = this.query$.pipe(
    tap(() => this.loading$.next(true)),
    switchMap(({ makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, sort, page, pageSize }) => {
      const [sortBy, sortDirection] = this.mapSort(sort);
      const params = { makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, page, pageSize, sortBy, sortDirection } as const;
      return this.api.searchListings(params).pipe(
        catchError(() => this.api.getListings({} as any).pipe(
          map(xs => ({ data: xs, totalCount: xs.length, totalPages: Math.max(1, Math.ceil(xs.length / pageSize)), currentPage: page, pageSize } as PaginationResponse<ListingDto>))
        ))
      );
    }),
    tap(() => this.loading$.next(false)),
    shareReplay(1)
  );

  // Derived UI streams
  readonly listings$ = this.results$.pipe(map(r => r.data));
  readonly totalCount$ = this.results$.pipe(map(r => r.totalCount));
  readonly totalPages$ = this.results$.pipe(map(r => r.totalPages));

  // Facet counts: server already computes counts ignoring each facet selection within a single response

  // Filtered facet option streams (only show options with count > 0)
  readonly makes$ = combineLatest([this.makesAll$, this.facetCounts$]).pipe(
    map(([makes, counts]) => makes.filter(m => (counts.makes.get(m.code) ?? 0) > 0)),
    shareReplay(1)
  );
  // Show only options with count > 0 (but keep currently selected visible)
  readonly transmissions$ = combineLatest([this.allTransmissions$, this.facetCounts$]).pipe(
    map(([opts, counts]) => opts.filter(t => (counts.transmissions.get(t.code) ?? 0) > 0)),
    shareReplay(1)
  );
  readonly bodyTypes$ = combineLatest([this.allBodyTypes$, this.facetCounts$]).pipe(
    map(([opts, counts]) => opts.filter(b => (counts.bodies.get(b.code) ?? 0) > 0)),
    shareReplay(1)
  );
  readonly fuelTypes$ = combineLatest([this.allFuelTypes$, this.facetCounts$]).pipe(
    map(([opts, counts]) => opts.filter(f => (counts.fuels.get(f.code) ?? 0) > 0)),
    shareReplay(1)
  );
  // Seats and Doors counts already ignore their own selection in server response
  readonly seatsCounts$ = this.facetCounts$.pipe(map(x => x.seats));
  readonly doorsCounts$ = this.facetCounts$.pipe(map(x => x.doors));
  // Options show only values with count > 0 (self-excluding counts already applied)
  readonly seats$ = this.seatsCounts$.pipe(
    map(m => {
      const defaults = [2,3,4,5,6,7,8,9];
      const fromCounts = Array.from(m.keys());
      return Array.from(new Set([...defaults, ...fromCounts])).sort((a,b)=>a-b);
    }),
    shareReplay(1)
  );
  readonly doors$ = this.doorsCounts$.pipe(
    map(m => {
      const defaults = [2,3,4,5];
      const fromCounts = Array.from(m.keys());
      return Array.from(new Set([...defaults, ...fromCounts])).sort((a,b)=>a-b);
    }),
    shareReplay(1)
  );
  // Models already depend on selected make; apply counts filter too
  readonly filteredModels$ = combineLatest([this.models$, this.facetCounts$]).pipe(
    map(([models, counts]) => models.filter(m => (counts.models.get(m.code) ?? 0) > 0)),
    shareReplay(1)
  );

  // Facet collapse preferences and open states (open when any selection is active)
  // Keep Make facet open on initial load
  readonly makePref$ = new BehaviorSubject<boolean>(true);
  readonly modelPref$ = new BehaviorSubject<boolean>(false);
  readonly transPref$ = new BehaviorSubject<boolean>(false);
  readonly bodyPref$ = new BehaviorSubject<boolean>(false);
  readonly fuelPref$ = new BehaviorSubject<boolean>(false);
  readonly seatsPref$ = new BehaviorSubject<boolean>(false);
  readonly doorsPref$ = new BehaviorSubject<boolean>(false);

  readonly makeOpen$ = this.makePref$.asObservable();
  readonly modelOpen$ = this.modelPref$.asObservable();
  readonly transOpen$ = this.transPref$.asObservable();
  readonly bodyOpen$ = this.bodyPref$.asObservable();
  readonly fuelOpen$ = this.fuelPref$.asObservable();
  readonly seatsOpen$ = this.seatsPref$.asObservable();
  readonly doorsOpen$ = this.doorsPref$.asObservable();

  toggleMakeFacet() { this.makePref$.next(!this.makePref$.value); }
  toggleModelFacet() { this.modelPref$.next(!this.modelPref$.value); }
  toggleTransmissionFacet() { this.transPref$.next(!this.transPref$.value); }
  toggleBodyFacet() { this.bodyPref$.next(!this.bodyPref$.value); }
  toggleFuelFacet() { this.fuelPref$.next(!this.fuelPref$.value); }
  toggleSeatsFacet() { this.seatsPref$.next(!this.seatsPref$.value); }
  toggleDoorsFacet() { this.doorsPref$.next(!this.doorsPref$.value); }
  // Topbar controls
  setView(v: 'grid'|'list') { this.view$.next(v); }
  toggleView() { const v = this.view$.value; this.view$.next(v === 'grid' ? 'list' : 'grid'); }
  toggleFilters() { this.filtersVisible$.next(!this.filtersVisible$.value); }
  toggleMobileSort() { this.mobileSortOpen$.next(!this.mobileSortOpen$.value); }
  setSort(v: string) { this.sort$.next(v); this.mobileSortOpen$.next(false); }

  // Range facet collapse preferences and open states
  readonly pricePref$ = new BehaviorSubject<boolean>(false);
  readonly yearPref$ = new BehaviorSubject<boolean>(false);
  readonly mileagePref$ = new BehaviorSubject<boolean>(false);

  readonly priceOpen$ = combineLatest([this.priceMin$, this.priceMax$, this.pricePref$]).pipe(
    map(([min, max, pref]) => ((min != null) || (max != null)) ? true : pref),
    shareReplay(1)
  );
  readonly yearOpen$ = combineLatest([this.yearMin$, this.yearMax$, this.yearPref$]).pipe(
    map(([min, max, pref]) => ((min != null) || (max != null)) ? true : pref),
    shareReplay(1)
  );
  readonly mileageOpen$ = combineLatest([this.mileageMin$, this.mileageMax$, this.mileagePref$]).pipe(
    map(([min, max, pref]) => ((min != null) || (max != null)) ? true : pref),
    shareReplay(1)
  );

  togglePriceFacet() { this.pricePref$.next(!this.pricePref$.value); }
  toggleYearFacet() { this.yearPref$.next(!this.yearPref$.value); }
  toggleMileageFacet() { this.mileagePref$.next(!this.mileagePref$.value); }

  // Facet count maps for template usage
  readonly makeCounts$ = this.facetCounts$.pipe(map(x => x.makes));
  readonly modelCounts$ = this.facetCounts$.pipe(map(x => x.models));
  readonly transmissionCounts$ = this.facetCounts$.pipe(map(x => x.transmissions));
  readonly bodyCounts$ = this.facetCounts$.pipe(map(x => x.bodies));
  readonly fuelCounts$ = this.facetCounts$.pipe(map(x => x.fuels));

  // Year counts and option lists derived from server
  readonly yearCounts$ = this.facetCounts$.pipe(map(x => x.years));
  readonly yearValues$ = this.yearCounts$.pipe(
    map(mapper => Array.from(mapper.keys()).sort((a, b) => b - a)),
    shareReplay(1)
  );
  readonly fromYearOptions$ = combineLatest([this.yearValues$, this.yearMax$]).pipe(
    map(([vals, max]) => vals.filter(y => max == null || y <= max)),
    shareReplay(1)
  );
  readonly toYearOptions$ = combineLatest([this.yearValues$, this.yearMin$]).pipe(
    map(([vals, min]) => vals.filter(y => min == null || y >= min)),
    shareReplay(1)
  );
  // Year prefix sums for dynamic range counts (ascending order)
  private readonly yearPrefixSums$ = combineLatest([
    this.yearCounts$,
    this.yearCounts$.pipe(map(m => Array.from(m.keys()).sort((a, b) => a - b)))
  ]).pipe(
    map(([counts, ascYears]) => {
      const prefix: number[] = [];
      const index = new Map<number, number>();
      let sum = 0;
      ascYears.forEach((y, i) => {
        index.set(y, i);
        sum += counts.get(y) ?? 0;
        prefix.push(sum);
      });
      return { sorted: ascYears, prefix, index } as const;
    }),
    shareReplay(1)
  );
  // From Year counts reflect [from .. currentMax] or >= from
  readonly fromYearCumulativeCounts$ = combineLatest([this.yearPrefixSums$, this.yearMax$]).pipe(
    map(([prep, maxYear]) => {
      const res = new Map<number, number>();
      const j = (maxYear != null) ? (prep.index.get(maxYear) ?? -1) : -1;
      for (let i = 0; i < prep.sorted.length; i++) {
        const y = prep.sorted[i];
        if (j >= 0) {
          if (i > j) { res.set(y, 0); continue; }
          const left = i > 0 ? prep.prefix[i - 1] : 0;
          const right = prep.prefix[j];
          res.set(y, right - left);
        } else {
          const left = i > 0 ? prep.prefix[i - 1] : 0;
          const total = prep.prefix[prep.prefix.length - 1] ?? 0;
          res.set(y, total - left);
        }
      }
      return res;
    }),
    shareReplay(1)
  );
  // To Year counts reflect [currentMin .. to] or <= to
  readonly toYearCumulativeCounts$ = combineLatest([this.yearPrefixSums$, this.yearMin$]).pipe(
    map(([prep, minYear]) => {
      const res = new Map<number, number>();
      const iMin = (minYear != null) ? (prep.index.get(minYear) ?? -1) : -1;
      for (let i = 0; i < prep.sorted.length; i++) {
        const y = prep.sorted[i];
        if (iMin >= 0) {
          if (i < iMin) { res.set(y, 0); continue; }
          const left = iMin > 0 ? prep.prefix[iMin - 1] : 0;
          const right = prep.prefix[i];
          res.set(y, right - left);
        } else {
          res.set(y, prep.prefix[i]);
        }
      }
      return res;
    }),
    shareReplay(1)
  );

  // Price counts and option lists derived from server buckets
  readonly priceCounts$ = this.facetCounts$.pipe(map(x => x.prices));
  readonly priceStep$ = this.facetCounts$.pipe(map(x => x.priceStep));
  readonly priceValues$ = this.priceCounts$.pipe(
    map(mapper => Array.from(mapper.keys()).sort((a, b) => a - b)),
    shareReplay(1)
  );
  // Precompute prefix sums to support dynamic range counts
  private readonly pricePrefixSums$ = combineLatest([this.priceCounts$, this.priceValues$]).pipe(
    map(([counts, vals]) => {
      const sorted = [...vals].sort((a, b) => a - b);
      const prefix: number[] = [];
      const index = new Map<number, number>();
      let sum = 0;
      sorted.forEach((start, i) => {
        index.set(start, i);
        sum += counts.get(start) ?? 0;
        prefix.push(sum);
      });
      return { sorted, prefix, index } as const;
    }),
    shareReplay(1)
  );
  // For "From" price, show counts within [from .. currentMax] if max set, else >= from
  readonly fromPriceCumulativeCounts$ = combineLatest([this.pricePrefixSums$, this.priceMax$, this.priceStep$]).pipe(
    map(([prep, maxEnd, step]) => {
      const res = new Map<number, number>();
      const maxStart = (maxEnd != null && step) ? (maxEnd - (step - 1)) : undefined;
      const j = (maxStart != null) ? prep.index.get(maxStart) ?? -1 : -1;
      for (let i = 0; i < prep.sorted.length; i++) {
        const start = prep.sorted[i];
        if (j >= 0) {
          if (i > j) { res.set(start, 0); continue; }
          const left = i > 0 ? prep.prefix[i - 1] : 0;
          const right = prep.prefix[j];
          res.set(start, right - left);
        } else {
          const left = i > 0 ? prep.prefix[i - 1] : 0;
          const total = prep.prefix[prep.prefix.length - 1] ?? 0;
          res.set(start, total - left);
        }
      }
      return res;
    }),
    shareReplay(1)
  );
  readonly fromPriceOptions$ = combineLatest([this.priceValues$, this.priceMax$, this.priceStep$]).pipe(
    map(([vals, max, step]) => vals.filter(p => max == null || p <= max)),
    shareReplay(1)
  );
  readonly toPriceOptions$ = combineLatest([this.priceValues$, this.priceMin$, this.priceStep$]).pipe(
    map(([vals, min, step]) => vals.filter(p => {
      if (min == null) return true;
      const end = p + (step ?? 0) - 1;
      return end >= min;
    })),
    shareReplay(1)
  );
  // For "To" price, show counts within [currentMin .. to] if min set, else <= to
  readonly toPriceCumulativeCounts$ = combineLatest([this.pricePrefixSums$, this.priceMin$]).pipe(
    map(([prep, minStart]) => {
      const res = new Map<number, number>();
      const iMin = (minStart != null) ? (prep.index.get(minStart) ?? -1) : -1;
      for (let i = 0; i < prep.sorted.length; i++) {
        const start = prep.sorted[i];
        if (iMin >= 0) {
          if (i < iMin) { res.set(start, 0); continue; }
          const left = iMin > 0 ? prep.prefix[iMin - 1] : 0;
          const right = prep.prefix[i];
          res.set(start, right - left);
        } else {
          res.set(start, prep.prefix[i]);
        }
      }
      return res;
    }),
    shareReplay(1)
  );

  // Mileage counts and option lists derived from server buckets
  readonly mileageCounts$ = this.facetCounts$.pipe(map(x => x.mileages));
  readonly mileageStep$ = this.facetCounts$.pipe(map(x => x.mileageStep));
  readonly minMileage$ = this.facetCounts$.pipe(map(x => x.minMileage));
  readonly mileageExact$ = this.facetCounts$.pipe(map(x => x.mileageExact ?? new Map<number, number>()));
  readonly mileageValues$ = this.mileageCounts$.pipe(
    map(mapper => Array.from(mapper.keys()).sort((a, b) => a - b)),
    shareReplay(1)
  );
  // Overall max mileage cap (max exact or bucket end)
  private readonly maxMileageOverall$ = combineLatest([this.mileageExact$, this.mileageValues$, this.mileageStep$]).pipe(
    map(([exact, bucketStarts, step]) => {
      const maxExact = Array.from(exact.keys()).reduce((mx, k) => Math.max(mx, k), 0);
      const lastStart = bucketStarts.length ? bucketStarts[bucketStarts.length - 1] : 0;
      const maxBucketEnd = (step ?? 0) > 0 ? (lastStart + (step ?? 0) - 1) : lastStart;
      return Math.max(maxExact, maxBucketEnd);
    }),
    shareReplay(1)
  );
  // Mileage option sequence includes seeds, step increments, and exact mileages present
  readonly mileageOptionValues$ = combineLatest([this.mileageValues$, this.mileageStep$, this.mileageExact$]).pipe(
    map(([bucketStarts, step, exact]) => {
      const inc = step || 5000;
      const maxStart = bucketStarts.length ? bucketStarts[bucketStarts.length - 1] : 0;
      const maxEnd = maxStart + inc - 1;
      const vals: number[] = [];
      const seed = [0, 100, 500, 1000, 2000, 3000, 4000];
      for (const v of seed) { if (v <= maxEnd) vals.push(v); }
      let cur = inc; // start at step (e.g., 5000)
      while (cur <= maxEnd) { vals.push(cur); cur += inc; }
      for (const v of Array.from(exact.keys())) { if (v <= maxEnd) vals.push(v); }
      return Array.from(new Set(vals)).sort((a, b) => a - b);
    }),
    shareReplay(1)
  );
  readonly fromMileageOptions$ = combineLatest([this.mileageOptionValues$, this.mileageMax$]).pipe(
    map(([vals, max]) => vals.filter(m => max == null || m <= max)),
    shareReplay(1)
  );
  // To mileage thousand-step options: start at lowest available thousand (>= minMileage), exclude 0
  readonly toMileageOptions$ = combineLatest([this.minMileage$, this.maxMileageOverall$]).pipe(
    map(([minAvail, overallMax]) => {
      const start = Math.max(1000, Math.ceil(((minAvail ?? 1)) / 1000) * 1000);
      const cap = Math.max(start, Math.ceil((overallMax ?? 0) / 1000) * 1000);
      const arr: number[] = [];
      for (let v = start; v <= cap; v += 1000) arr.push(v);
      return arr;
    }),
    shareReplay(1)
  );

  // Derive selected 'To' bucket start from max using fixed step
  readonly mileageMaxStart$ = combineLatest([this.mileageMax$, this.mileageStep$]).pipe(
    map(([end, step]) => (end == null || !step) ? undefined : (end - (step - 1))),
    shareReplay(1)
  );
  // Mileage prefix sums for dynamic range counts
  private readonly mileagePrefixSums$ = combineLatest([this.mileageCounts$, this.mileageValues$]).pipe(
    map(([counts, vals]) => {
      const sorted = [...vals].sort((a, b) => a - b);
      const prefix: number[] = [];
      const index = new Map<number, number>();
      let sum = 0;
      sorted.forEach((start, i) => {
        index.set(start, i);
        sum += counts.get(start) ?? 0;
        prefix.push(sum);
      });
      return { sorted, prefix, index } as const;
    }),
    shareReplay(1)
  );
  // From Mileage counts reflect [from .. currentMax] or >= from (using bucket start for max)
  readonly fromMileageCumulativeCounts$ = combineLatest([this.mileagePrefixSums$, this.mileageMaxStart$]).pipe(
    map(([prep, maxStart]) => {
      const res = new Map<number, number>();
      const j = (maxStart != null) ? (prep.index.get(maxStart) ?? -1) : -1;
      for (let i = 0; i < prep.sorted.length; i++) {
        const m = prep.sorted[i];
        if (j >= 0) {
          if (i > j) { res.set(m, 0); continue; }
          const left = i > 0 ? prep.prefix[i - 1] : 0;
          const right = prep.prefix[j];
          res.set(m, right - left);
        } else {
          const left = i > 0 ? prep.prefix[i - 1] : 0;
          const total = prep.prefix[prep.prefix.length - 1] ?? 0;
          res.set(m, total - left);
        }
      }
      return res;
    }),
    shareReplay(1)
  );
  // To Mileage counts reflect [currentMin .. to] or <= to
  readonly toMileageCumulativeCounts$ = combineLatest([this.mileagePrefixSums$, this.mileageMin$]).pipe(
    map(([prep, minStart]) => {
      const res = new Map<number, number>();
      const iMin = (minStart != null) ? (prep.index.get(minStart) ?? -1) : -1;
      for (let i = 0; i < prep.sorted.length; i++) {
        const m = prep.sorted[i];
        if (iMin >= 0) {
          if (i < iMin) { res.set(m, 0); continue; }
          const left = iMin > 0 ? prep.prefix[iMin - 1] : 0;
          const right = prep.prefix[i];
          res.set(m, right - left);
        } else {
          res.set(m, prep.prefix[i]);
        }
      }
      return res;
    }),
    shareReplay(1)
  );
  // Exact mileage prefix sums for thousand-rounded counts
  private readonly mileageExactPrefix$ = this.mileageExact$.pipe(
    map(exact => {
      const sorted = Array.from(exact.keys()).sort((a, b) => a - b);
      const prefix: number[] = [];
      let sum = 0;
      for (const m of sorted) { sum += exact.get(m) ?? 0; prefix.push(sum); }
      return { sorted, prefix } as const;
    }),
    shareReplay(1)
  );
  // Total cars ignoring mileage (for 0 option on From)
  private readonly totalMileageAll$ = this.mileageExactPrefix$.pipe(
    map(prep => prep.prefix[prep.prefix.length - 1] ?? 0),
    shareReplay(1)
  );
  // Display counts for From-mileage options using thousand-rounded end; override 0 => total
  readonly fromMileageDisplayCounts$ = combineLatest([
    this.mileageExactPrefix$,
    this.mileageMax$,
    this.fromMileageOptions$,
    this.totalMileageAll$
  ]).pipe(
    map(([prep, maxSel, opts, totalAll]) => {
      const res = new Map<number, number>();
      const sumUpTo = (x: number) => {
        const arr = prep.sorted;
        let lo = 0, hi = arr.length - 1, ans = -1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (arr[mid] <= x) { ans = mid; lo = mid + 1; } else { hi = mid - 1; }
        }
        return ans >= 0 ? prep.prefix[ans] : 0;
      };
      const endRounded = (maxSel != null) ? Math.ceil(maxSel / 1000) * 1000 : (prep.sorted[prep.sorted.length - 1] ?? 0);
      for (const v of opts) {
        const fromVal = v || 0;
        const c = Math.max(0, sumUpTo(endRounded) - sumUpTo(fromVal - 1));
        res.set(v, c);
      }
      // 0 shows all cars ignoring To
      res.set(0, totalAll);
      return res;
    }),
    shareReplay(1)
  );
  readonly toMileageDisplayCounts$ = combineLatest([
    this.mileageExactPrefix$,
    this.mileageMin$,
    this.toMileageOptions$
  ]).pipe(
    map(([prep, min, opts]) => {
      const res = new Map<number, number>();
      const sumUpTo = (x: number) => {
        const arr = prep.sorted;
        let lo = 0, hi = arr.length - 1, ans = -1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (arr[mid] <= x) { ans = mid; lo = mid + 1; } else { hi = mid - 1; }
        }
        return ans >= 0 ? prep.prefix[ans] : 0;
      };
      const minLess = (min != null) ? sumUpTo(min - 1) : 0;
      for (const v of opts) {
        const endRounded = Math.ceil((v || 0) / 1000) * 1000;
        const c = Math.max(0, sumUpTo(endRounded) - minLess);
        res.set(v, c);
      }
      return res;
    }),
    shareReplay(1)
  );

  // From mileage options filtered to those with non-zero counts (0 included)
  readonly fromMileageOptionsFiltered$ = combineLatest([this.fromMileageOptions$, this.fromMileageDisplayCounts$]).pipe(
    map(([opts, counts]) => opts.filter(o => (counts.get(o) ?? 0) > 0)),
    shareReplay(1)
  );
  readonly toMileageOptionsFiltered$ = combineLatest([this.toMileageOptions$, this.toMileageDisplayCounts$, this.minMileage$]).pipe(
    map(([opts, counts, min]) => {
      const minVal = (min ?? 0);
      return opts.filter(o => o > 0 && o >= minVal && (counts.get(o) ?? 0) > 0);
    }),
    shareReplay(1)
  );

  // Show stepped From options where counts decrease (plus 0)
  readonly fromMileageOptionsStepped$ = combineLatest([this.fromMileageOptionsFiltered$, this.fromMileageDisplayCounts$]).pipe(
    map(([opts, counts]) => {
      const sorted = [...opts].sort((a, b) => a - b);
      const result: number[] = [];
      let last: number | undefined = undefined;
      for (const v of sorted) {
        const c = counts.get(v) ?? 0;
        if (result.length === 0) { result.push(v); last = c; continue; }
        if (last == null || c < last) { result.push(v); last = c; }
      }
      return result;
    }),
    shareReplay(1)
  );
  readonly fromMileageOptionsVisible$ = this.fromMileageOptionsStepped$;
  readonly toMileageOptionsStepped$ = combineLatest([this.toMileageOptionsFiltered$, this.toMileageDisplayCounts$]).pipe(
    map(([opts, counts]) => {
      const sorted = [...opts].sort((a, b) => a - b);
      const result: number[] = [];
      let last = -1;
      for (const v of sorted) {
        const c = counts.get(v) ?? 0;
        if (result.length === 0) { result.push(v); last = c; continue; }
        if (c > last) { result.push(v); last = c; }
      }
      return result;
    }),
    shareReplay(1)
  );

  // Active filter chips (kind + id/value for removal)
  readonly activeFilterChips$ = combineLatest([
    this.selectedMakeCodes$, this.makes$.pipe(startWith([] as any[])),
    this.selectedModelCodes$, this.filteredModels$.pipe(startWith([] as any[])),
    this.selectedTransmissionCodes$, this.transmissions$.pipe(startWith([] as any[])),
    this.selectedBodyTypeCodes$, this.bodyTypes$.pipe(startWith([] as any[])),
    this.selectedFuelTypeCodes$, this.fuelTypes$.pipe(startWith([] as any[])),
    this.selectedSeats$, this.seats$.pipe(startWith([] as number[])),
    this.selectedDoors$, this.doors$.pipe(startWith([] as number[]))
  ]).pipe(
    map(([mkCodes, makes, mdCodes, models, trCodes, transmissions, btCodes, bodies, fuCodes, fuels, seatVals, seatOpts, doorVals, doorOpts]) => {
      const chips: ActiveFilterChip[] = [];
      const pushNameChips = (codes: string[], list: { code: string; name: string }[], kind: ActiveFilterChip['kind']) => {
        codes.forEach(code => {
          const nm = list.find(x => x.code === code)?.name;
          if (nm) chips.push({ kind, code, label: nm });
        });
      };
      pushNameChips(mkCodes, makes as any, 'make');
      pushNameChips(mdCodes, models as any, 'model');
      pushNameChips(trCodes, transmissions as any, 'transmission');
      pushNameChips(btCodes, bodies as any, 'body');
      pushNameChips(fuCodes, fuels as any, 'fuel');
      seatVals.forEach(v => chips.push({ kind: 'seats', value: v, label: `${v} seats` }));
      doorVals.forEach(v => chips.push({ kind: 'doors', value: v, label: `${v} doors` }));
      return chips;
    }),
    shareReplay(1)
  );

  // Count of active filters for quick display (include ranges)
  readonly activeFilterCount$ = combineLatest([
    this.activeFilterChips$,
    this.priceMin$, this.priceMax$,
    this.yearMin$, this.yearMax$,
    this.mileageMin$, this.mileageMax$
  ]).pipe(
    map(([chips, pmin, pmax, ymin, ymax, mmin, mmax]) => {
      let extra = 0;
      if (pmin != null || pmax != null) extra++;
      if (ymin != null || ymax != null) extra++;
      if (mmin != null || mmax != null) extra++;
      return (chips?.length ?? 0) + extra;
    })
  );

  constructor() {
    // Enforce grid view on small screens and hide list option
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(max-width: 767px)');
      const enforce = () => { if (mq.matches && this.view$.value !== 'grid') this.view$.next('grid'); };
      enforce();
      mq.addEventListener?.('change', enforce);
    }
    // Seed from URL using names (comma-separated)
    combineLatest([
      this.route.queryParamMap,
      this.makesAll$.pipe(startWith([] as any[])),
      this.modelsAll$.pipe(startWith([] as any[])),
      this.allTransmissions$.pipe(startWith([] as any[])),
      this.allBodyTypes$.pipe(startWith([] as any[])),
      this.allFuelTypes$.pipe(startWith([] as any[]))
    ]).subscribe(([q, makes, models, transmissions, bodies, fuels]) => {
      // Only treat the first emission as initial seeding
      const isFirstSeed = !this.hasSeeded;
      if (isFirstSeed) this.seedingFromUrl = true;
      const namesToCodes = (param: string | null, list: { code: string; name: string }[]) => {
        if (!param) return [] as string[];
        const normalizeQuery = (s: string) => s.trim().toLowerCase().replace(/[+\-]+/g, ' ').replace(/\s+/g, ' ');
        const normalizeLabel = (s: string) => (s || '').trim().toLowerCase().replace(/[\s_\-]+/g, ' ').replace(/\s+/g, ' ');
        const wanted = param.split(',').map(normalizeQuery).filter(Boolean);
        return list.filter(x => wanted.includes(normalizeLabel(x.name ?? ''))).map(x => x.code);
      };
      const codesFrom = (key: string) => q.getAll(key).filter(Boolean);
      const numbersFromCsv = (param: string | null) => {
        if (!param) return [] as number[];
        return param.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
      };
      // Prefer code-based params when present; fallback to names
      const mkCodes = codesFrom('makeCodes');
      const mdCodes = codesFrom('modelCodes');
      const trCodes = codesFrom('transmissionTypeCodes');
      const btCodes = codesFrom('bodyTypeCodes');
      const fuCodes = codesFrom('fuelTypeCodes');

      this.selectedMakeCodes$.next(mkCodes.length ? mkCodes : namesToCodes(q.get('make'), makes));
      this.selectedModelCodes$.next(mdCodes.length ? mdCodes : namesToCodes(q.get('model'), models));
      this.selectedTransmissionCodes$.next(trCodes.length ? trCodes : namesToCodes(q.get('trans'), transmissions));
      this.selectedBodyTypeCodes$.next(btCodes.length ? btCodes : namesToCodes(q.get('body'), bodies));
      this.selectedFuelTypeCodes$.next(fuCodes.length ? fuCodes : namesToCodes(q.get('fuel'), fuels));
      // Numeric facets and ranges
      this.selectedSeats$.next(numbersFromCsv(q.get('seats')));
      this.selectedDoors$.next(numbersFromCsv(q.get('doors')));
      const toNum = (v: string | null) => (v == null || v === '') ? undefined : Number(v);
      this.priceMin$.next(toNum(q.get('pmin')) ?? toNum(q.get('priceMin')));
      this.priceMax$.next(toNum(q.get('pmax')) ?? toNum(q.get('priceMax')));
      this.yearMin$.next(toNum(q.get('ymin')));
      this.yearMax$.next(toNum(q.get('ymax')));
      this.mileageMin$.next(toNum(q.get('mmin')) ?? toNum(q.get('mileageMin')));
      this.mileageMax$.next(toNum(q.get('mmax')) ?? toNum(q.get('mileageMax')));
      const s = q.get('sort'); if (s) this.sort$.next(s);
      const v = (q.get('view') || '').toLowerCase(); if (v === 'list' || v === 'grid') this.view$.next(v as any);
      const p = q.get('page'); this.page$.next(p ? Number(p) : 1);
      const fv = (q.get('filters') || '').toLowerCase(); if (fv && (fv === '1' || fv === 'true' || fv === 'open')) this.filtersVisible$.next(true);

      // On initial load, open facets that have selections
      if ((this.selectedMakeCodes$.value?.length ?? 0) > 0) this.makePref$.next(true);
      if ((this.selectedModelCodes$.value?.length ?? 0) > 0) this.modelPref$.next(true);
      if ((this.selectedTransmissionCodes$.value?.length ?? 0) > 0) this.transPref$.next(true);
      if ((this.selectedBodyTypeCodes$.value?.length ?? 0) > 0) this.bodyPref$.next(true);
      if ((this.selectedFuelTypeCodes$.value?.length ?? 0) > 0) this.fuelPref$.next(true);
      if ((this.selectedSeats$.value?.length ?? 0) > 0) this.seatsPref$.next(true);
      if ((this.selectedDoors$.value?.length ?? 0) > 0) this.doorsPref$.next(true);
      if (isFirstSeed) { this.hasSeeded = true; this.seedingFromUrl = false; }
    });

    // Persist to URL on changes
    combineLatest([
      this.selectedMakeCodes$, this.makesAll$.pipe(startWith([] as any[])),
      this.selectedModelCodes$, this.modelsAll$.pipe(startWith([] as any[])),
      this.selectedTransmissionCodes$, this.allTransmissions$.pipe(startWith([] as any[])),
      this.selectedBodyTypeCodes$, this.allBodyTypes$.pipe(startWith([] as any[])),
      this.selectedFuelTypeCodes$, this.allFuelTypes$.pipe(startWith([] as any[])),
      this.selectedSeats$, this.selectedDoors$,
      this.priceMin$, this.priceMax$,
      this.yearMin$, this.yearMax$,
      this.mileageMin$, this.mileageMax$,
      this.sort$, this.page$,
      this.filtersVisible$
    ]).pipe(debounceTime(50)).subscribe(([mkIds, makes, mdIds, models, trIds, transmissions, btIds, bodies, fuIds, fuels, seats, doors, pmin, pmax, ymin, ymax, mmin, mmax, sort, page, filtersVisible]) => {
      const slug = (s: string) => (s || '').toLowerCase().trim().replace(/[\s_]+/g, '+').replace(/[+]+/g, '+');
      const namesFor = (codes: string[], list: { code: string; name: string }[]) =>
        codes
          .map(code => list.find(x => x.code === code)?.name)
          .filter((nm): nm is string => typeof nm === 'string' && nm.length > 0)
          .map(slug);
      const current = this.route.snapshot.queryParamMap;
      const useFallback = this.seedingFromUrl && !this.hasSeeded;
      // Build params without default sort/page; append them at the end if changed
      const qp: any = {
        make: (() => { const v = namesFor(mkIds, makes).join(','); return v || (useFallback ? current.get('make') : undefined); })(),
        model: (() => { const v = namesFor(mdIds, models).join(','); return v || (useFallback ? current.get('model') : undefined); })(),
        trans: (() => { const v = namesFor(trIds, transmissions).join(','); return v || (useFallback ? current.get('trans') : undefined); })(),
        body: (() => { const v = namesFor(btIds, bodies).join(','); return v || (useFallback ? current.get('body') : undefined); })(),
        fuel: (() => { const v = namesFor(fuIds, fuels).join(','); return v || (useFallback ? current.get('fuel') : undefined); })(),
        seats: (seats?.length ? seats.join(',') : (useFallback ? (current.get('seats') ?? undefined) : undefined)),
        doors: (doors?.length ? doors.join(',') : (useFallback ? (current.get('doors') ?? undefined) : undefined)),
        pmin: (pmin != null ? pmin : (useFallback ? (current.get('pmin') ?? undefined) : undefined)),
        pmax: (pmax != null ? pmax : (useFallback ? (current.get('pmax') ?? undefined) : undefined)),
        ymin: (ymin != null ? ymin : (useFallback ? (current.get('ymin') ?? undefined) : undefined)),
        ymax: (ymax != null ? ymax : (useFallback ? (current.get('ymax') ?? undefined) : undefined)),
        mmin: (mmin != null ? mmin : (useFallback ? (current.get('mmin') ?? undefined) : undefined)),
        mmax: (mmax != null ? mmax : (useFallback ? (current.get('mmax') ?? undefined) : undefined))
      };
      // Remove any code-based params so URL stays name-based
      qp.makeCodes = null;
      qp.modelCodes = null;
      qp.transmissionTypeCodes = null;
      qp.bodyTypeCodes = null;
      qp.fuelTypeCodes = null;
      qp.priceMin = null;
      qp.priceMax = null;
      qp.mileageMin = null;
      qp.mileageMax = null;
      // Persist view (only when not default)
      if ((this.view$.value ?? 'grid') === 'list') qp.view = 'list'; else qp.view = null;
      // Persist filters panel visibility (best UX: only include when open)
      qp.filters = filtersVisible ? '1' : null;
      // Append non-default sort/page to the end
      if (sort !== 'price-asc') qp.sort = sort;
      if (page !== 1) qp.page = page;
      this.router.navigate([], { queryParams: qp });
    });

    // Reset to first page when filters or sort change
    combineLatest([
      this.selectedMakeCodes$, this.selectedModelCodes$, this.selectedTransmissionCodes$, this.selectedBodyTypeCodes$, this.selectedFuelTypeCodes$,
      this.selectedSeats$, this.selectedDoors$,
      this.priceMin$, this.priceMax$, this.yearMin$, this.yearMax$, this.mileageMin$, this.mileageMax$,
      this.sort$
    ])
      .pipe(debounceTime(50)).subscribe(() => this.page$.next(1));

    // Reset dependent selections to avoid stale combos
    this.selectedMakeCodes$.pipe(distinctUntilChanged()).subscribe(() => {
      if (this.seedingFromUrl) return;
      this.selectedModelCodes$.next([]);
    });
    // Variant dependency removed
  }

  private mapSort(v: string): ['price'|'year', 'asc'|'desc'] {
    switch (v) {
      case 'price-asc': return ['price','asc'];
      case 'price-desc': return ['price','desc'];
      case 'year-asc': return ['year','asc'];
      case 'year-desc': return ['year','desc'];
      default: return ['price','asc'];
    }
  }

  prevPage() { combineLatest([this.page$, this.totalPages$]).pipe(take(1)).subscribe(([p]) => { if (p > 1) this.page$.next(p - 1); }); }
  nextPage() { combineLatest([this.page$, this.totalPages$]).pipe(take(1)).subscribe(([p, t]) => { if (p < t) this.page$.next(p + 1); }); }

  // Toggle helpers for multiselect checkboxes
  private toggle<T>(ids$: BehaviorSubject<T[]>, id: T) {
    const curr = ids$.value;
    ids$.next(curr.includes(id as any) ? curr.filter(x => x !== (id as any)) : [...curr, id]);
  }
  clear<T>(ids$: BehaviorSubject<T[]>) { ids$.next([]); }
  private removeFrom<T>(ids$: BehaviorSubject<T[]>, idOrCode: T) { ids$.next(ids$.value.filter(x => x !== idOrCode)); }
  clearAll() {
    this.selectedMakeCodes$.next([]);
    this.selectedModelCodes$.next([]);
    this.selectedTransmissionCodes$.next([]);
    this.selectedBodyTypeCodes$.next([]);
    this.selectedFuelTypeCodes$.next([]);
    this.selectedSeats$.next([]);
    this.selectedDoors$.next([]);
    this.priceMin$.next(undefined); this.priceMax$.next(undefined);
    this.yearMin$.next(undefined); this.yearMax$.next(undefined);
    this.mileageMin$.next(undefined); this.mileageMax$.next(undefined);
  }
  toggleMake(code: string) { this.toggle(this.selectedMakeCodes$, code); }
  toggleModel(code: string) { this.toggle(this.selectedModelCodes$, code); }
  toggleTransmission(code: string) { this.toggle(this.selectedTransmissionCodes$, code); }
  toggleBodyType(code: string) { this.toggle(this.selectedBodyTypeCodes$, code); }
  toggleFuelType(code: string) { this.toggle(this.selectedFuelTypeCodes$, code); }
  toggleSeat(v: number) { this.toggle(this.selectedSeats$, v); }
  toggleDoor(v: number) { this.toggle(this.selectedDoors$, v); }

  // Remove a single active filter via chip close
  removeChip(c: { kind: 'make'|'model'|'transmission'|'body'|'fuel'|'seats'|'doors'; code?: string; value?: number }) {
    switch (c.kind) {
      case 'make': if (c.code != null) this.removeFrom(this.selectedMakeCodes$, c.code); break;
      case 'model': if (c.code != null) this.removeFrom(this.selectedModelCodes$, c.code); break;
      case 'transmission': if (c.code != null) this.removeFrom(this.selectedTransmissionCodes$, c.code); break;
      case 'body': if (c.code != null) this.removeFrom(this.selectedBodyTypeCodes$, c.code); break;
      case 'fuel': if (c.code != null) this.removeFrom(this.selectedFuelTypeCodes$, c.code); break;
      case 'seats': if (c.value != null) this.removeFrom(this.selectedSeats$, c.value); break;
      case 'doors': if (c.value != null) this.removeFrom(this.selectedDoors$, c.value); break;
    }
  }

  // Simple illustrative monthly price (placeholder UI affordance)
  monthly(price: number): number { return Math.round((price || 0) / 60); }

  // Year range validation: ensure From <= To by adjusting the opposite side
  onYearMinChange(v: any) {
    const val = v === '' ? undefined : Number(v);
    const currentMax = this.yearMax$.value;
    this.yearMin$.next(val);
    if (val != null && currentMax != null && val > currentMax) {
      this.yearMax$.next(val);
    }
  }
  onYearMaxChange(v: any) {
    const val = v === '' ? undefined : Number(v);
    const currentMin = this.yearMin$.value;
    this.yearMax$.next(val);
    if (val != null && currentMin != null && val < currentMin) {
      this.yearMin$.next(val);
    }
  }

  // Price range via bucketed selects: ensure From <= To
  onPriceMinChange(v: any) {
    const val = v === '' ? undefined : Number(v);
    const currentMax = this.priceMax$.value;
    this.priceMin$.next(val);
    if (val != null && currentMax != null && val > currentMax) {
      this.priceMax$.next(val);
    }
  }
  onPriceMaxChange(v: any) {
    const bucketStart = v === '' ? undefined : Number(v);
    // Convert bucket start to bucket end using step
    if (bucketStart == null) { this.priceMax$.next(undefined); return; }
    combineLatest([this.priceStep$]).pipe(take(1)).subscribe(([step]) => {
      const end = bucketStart + (step ?? 0) - 1;
      const currentMin = this.priceMin$.value;
      this.priceMax$.next(end);
      if (currentMin != null && end < currentMin) {
        this.priceMin$.next(bucketStart);
      }
    });
  }

  // Mileage range via bucketed selects: ensure From <= To
  onMileageMinChange(v: any) {
    const val = v === '' ? undefined : Number(v);
    const currentMax = this.mileageMax$.value;
    this.mileageMin$.next(val);
    if (val != null && currentMax != null && val > currentMax) {
      this.mileageMax$.next(val);
    }
  }
  onMileageMaxChange(v: any) {
    const val = v === '' ? undefined : Number(v);
    if (val == null) { this.mileageMax$.next(undefined); return; }
    const currentMin = this.mileageMin$.value;
    this.mileageMax$.next(val);
    if (currentMin != null && val < currentMin) {
      this.mileageMin$.next(val);
    }
  }

  // Keyboard shortcuts: g = grid, l = list, f = filters, esc = close panels
  @HostListener('document:keydown', ['$event'])
  handleKeydown(ev: KeyboardEvent) {
    const tag = (ev.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea' || (ev as any).isComposing) return;
    const key = ev.key?.toLowerCase();
    if (key === 'g') {
      this.setView('grid');
    } else if (key === 'l') {
      // Respect small screens: list view will be forced to grid by media enforcement
      this.setView('list');
    } else if (key === 'f') {
      this.toggleFilters();
    } else if (key === 'escape') {
      if (this.mobileSortOpen$.value) this.mobileSortOpen$.next(false);
      if (this.filtersVisible$.value) this.filtersVisible$.next(false);
    }
  }

  // Simple per-card image carousel state (similar to Featured Listings)
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
}
