import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingsApiService, ListingDto, MakeDto, ModelDto, OptionDto, PaginationResponse } from '../listings/listings-api.service';
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

  // Sorting options (used in template)
  readonly sortOptions = [
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Year: Newest', value: 'year-desc' },
    { label: 'Year: Oldest', value: 'year-asc' }
  ];

  // Filter subjects
  readonly selectedMakeIds$ = new BehaviorSubject<number[]>([]);
  readonly selectedModelIds$ = new BehaviorSubject<number[]>([]);
  readonly selectedTransmissionIds$ = new BehaviorSubject<number[]>([]);
  readonly selectedBodyTypeIds$ = new BehaviorSubject<number[]>([]);
  readonly selectedFuelTypeIds$ = new BehaviorSubject<number[]>([]);

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

  // Reference data
  private readonly allMakes$ = this.api.getMakes().pipe(shareReplay(1));
  private readonly options$ = this.api.getOptions().pipe(shareReplay(1));
  private readonly allTransmissions$ = this.options$.pipe(map(o => o.transmissions));
  private readonly allBodyTypes$ = this.options$.pipe(map(o => o.bodyTypes));
  private readonly allFuelTypes$ = this.options$.pipe(map(o => o.fuelTypes));

  // Models depend on selected make (unfiltered)
  private readonly allModels$ = this.api.getModels().pipe(shareReplay(1));
  readonly models$ = combineLatest([this.allModels$, this.selectedMakeIds$]).pipe(
    map(([all, ids]) => ids.length ? all.filter(m => ids.includes(m.makeId)) : all),
    shareReplay(1)
  );

  // Variants filter removed

  // Query params stream
  private readonly query$ = combineLatest([
    this.selectedMakeIds$,
    this.selectedModelIds$,
    this.selectedTransmissionIds$,
    this.selectedBodyTypeIds$,
    this.selectedFuelTypeIds$,
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
    map(([makeIds, modelIds, transmissionIds, bodyTypeIds, fuelTypeIds, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, sort, page, pageSize]) => ({ makeIds, modelIds, transmissionIds, bodyTypeIds, fuelTypeIds, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, sort, page, pageSize })),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay(1)
  );

  // Results stream
  readonly results$ = this.query$.pipe(
    tap(() => this.loading$.next(true)),
    switchMap(({ makeIds, modelIds, transmissionIds, bodyTypeIds, fuelTypeIds, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, sort, page, pageSize }) => {
      const [sortBy, sortDirection] = this.mapSort(sort);
      const params = { makeIds, modelIds, transmissionIds, bodyTypeIds, fuelTypeIds, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, page, pageSize, sortBy, sortDirection } as const;
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

  // Facet counts: for each facet, compute counts based on listings matching other filters
  private readonly facetCounts$ = combineLatest([
    this.selectedMakeIds$,
    this.selectedModelIds$,
    this.selectedTransmissionIds$,
    this.selectedBodyTypeIds$,
    this.selectedFuelTypeIds$,
    this.priceMin$,
    this.priceMax$,
    this.yearMin$,
    this.yearMax$,
    this.mileageMin$,
    this.mileageMax$
  ]).pipe(
    debounceTime(100),
    map(([makeIds, modelIds, transmissionIds, bodyTypeIds, fuelTypeIds, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax]) => ({ makeIds, modelIds, transmissionIds, bodyTypeIds, fuelTypeIds, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax })),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    switchMap(params => this.api.getFacetCounts(params)),
    map(dto => ({
      makes: new Map<number, number>(Object.entries(dto.makes).map(([k,v]) => [Number(k), v as number])),
      models: new Map<number, number>(Object.entries(dto.models).map(([k,v]) => [Number(k), v as number])),
      transmissions: new Map<number, number>(Object.entries(dto.transmissions).map(([k,v]) => [Number(k), v as number])),
      bodies: new Map<number, number>(Object.entries(dto.bodies).map(([k,v]) => [Number(k), v as number])),
      fuels: new Map<number, number>(Object.entries(dto.fuels).map(([k,v]) => [Number(k), v as number])),
      years: new Map<number, number>(Object.entries(dto.years).map(([k,v]) => [Number(k), v as number])),
      prices: new Map<number, number>(Object.entries(dto.prices).map(([k,v]) => [Number(k), v as number])),
      mileages: new Map<number, number>(Object.entries(dto.mileages).map(([k,v]) => [Number(k), v as number])),
      priceStep: dto.priceStep,
      mileageStep: dto.mileageStep
    })),
    shareReplay(1)
  );

  // Filtered facet option streams (only show options with count > 0)
  readonly makes$ = combineLatest([this.allMakes$, this.facetCounts$]).pipe(
    map(([makes, counts]) => makes.filter(m => (counts.makes.get(m.id) ?? 0) > 0)),
    shareReplay(1)
  );
  readonly transmissions$ = combineLatest([this.allTransmissions$, this.facetCounts$]).pipe(
    map(([opts, counts]) => opts.filter(t => (counts.transmissions.get(t.id) ?? 0) > 0)),
    shareReplay(1)
  );
  readonly bodyTypes$ = combineLatest([this.allBodyTypes$, this.facetCounts$]).pipe(
    map(([opts, counts]) => opts.filter(b => (counts.bodies.get(b.id) ?? 0) > 0)),
    shareReplay(1)
  );
  readonly fuelTypes$ = combineLatest([this.allFuelTypes$, this.facetCounts$]).pipe(
    map(([opts, counts]) => opts.filter(f => (counts.fuels.get(f.id) ?? 0) > 0)),
    shareReplay(1)
  );
  // Models already depend on selected make; apply counts filter too
  readonly filteredModels$ = combineLatest([this.models$, this.facetCounts$]).pipe(
    map(([models, counts]) => models.filter(m => (counts.models.get(m.id) ?? 0) > 0)),
    shareReplay(1)
  );

  // Facet collapse preferences and open states (open when any selection is active)
  // Keep Make facet open on initial load
  readonly makePref$ = new BehaviorSubject<boolean>(true);
  readonly modelPref$ = new BehaviorSubject<boolean>(false);
  readonly transPref$ = new BehaviorSubject<boolean>(false);
  readonly bodyPref$ = new BehaviorSubject<boolean>(false);
  readonly fuelPref$ = new BehaviorSubject<boolean>(false);

  readonly makeOpen$ = combineLatest([this.selectedMakeIds$, this.makePref$]).pipe(map(([ids, pref]) => (ids.length > 0) ? true : pref), shareReplay(1));
  readonly modelOpen$ = combineLatest([this.selectedModelIds$, this.modelPref$]).pipe(map(([ids, pref]) => (ids.length > 0) ? true : pref), shareReplay(1));
  readonly transOpen$ = combineLatest([this.selectedTransmissionIds$, this.transPref$]).pipe(map(([ids, pref]) => (ids.length > 0) ? true : pref), shareReplay(1));
  readonly bodyOpen$ = combineLatest([this.selectedBodyTypeIds$, this.bodyPref$]).pipe(map(([ids, pref]) => (ids.length > 0) ? true : pref), shareReplay(1));
  readonly fuelOpen$ = combineLatest([this.selectedFuelTypeIds$, this.fuelPref$]).pipe(map(([ids, pref]) => (ids.length > 0) ? true : pref), shareReplay(1));

  toggleMakeFacet() { this.makePref$.next(!this.makePref$.value); }
  toggleModelFacet() { this.modelPref$.next(!this.modelPref$.value); }
  toggleTransmissionFacet() { this.transPref$.next(!this.transPref$.value); }
  toggleBodyFacet() { this.bodyPref$.next(!this.bodyPref$.value); }
  toggleFuelFacet() { this.fuelPref$.next(!this.fuelPref$.value); }

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
  readonly mileageValues$ = this.mileageCounts$.pipe(
    map(mapper => Array.from(mapper.keys()).sort((a, b) => a - b)),
    shareReplay(1)
  );
  readonly fromMileageOptions$ = combineLatest([this.mileageValues$, this.mileageMax$]).pipe(
    map(([vals, max]) => vals.filter(m => max == null || m <= max)),
    shareReplay(1)
  );
  readonly toMileageOptions$ = combineLatest([this.mileageValues$, this.mileageMin$, this.mileageStep$]).pipe(
    map(([vals, min, step]) => vals.filter(m => {
      if (min == null) return true;
      const end = m + (step ?? 0) - 1;
      return end >= min;
    })),
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

  // Active filter labels (for chips)
  readonly activeFilters$ = combineLatest([
    this.selectedMakeIds$, this.makes$.pipe(startWith([] as MakeDto[])),
    this.selectedModelIds$, this.filteredModels$.pipe(startWith([] as ModelDto[])),
    this.selectedTransmissionIds$, this.transmissions$.pipe(startWith([] as OptionDto[])),
    this.selectedBodyTypeIds$, this.bodyTypes$.pipe(startWith([] as OptionDto[])),
    this.selectedFuelTypeIds$, this.fuelTypes$.pipe(startWith([] as OptionDto[]))
  ]).pipe(
    map(([mkIds, makes, mdIds, models, trIds, transmissions, btIds, bodies, fuIds, fuels]) => {
      const namesFor = (ids: number[], list: { id: number; name: string }[]) => ids.map(id => list.find(x => x.id === id)?.name).filter(Boolean) as string[];
      const labels = [
        ...namesFor(mkIds, makes),
        ...namesFor(mdIds, models),
        ...namesFor(trIds, transmissions),
        ...namesFor(btIds, bodies),
        ...namesFor(fuIds, fuels)
      ];
      return labels;
    }),
    shareReplay(1)
  );

  // Count of active filters for quick display (include ranges)
  readonly activeFilterCount$ = combineLatest([
    this.activeFilters$,
    this.priceMin$, this.priceMax$,
    this.yearMin$, this.yearMax$,
    this.mileageMin$, this.mileageMax$
  ]).pipe(
    map(([labels, pmin, pmax, ymin, ymax, mmin, mmax]) => {
      let extra = 0;
      if (pmin != null || pmax != null) extra++;
      if (ymin != null || ymax != null) extra++;
      if (mmin != null || mmax != null) extra++;
      return labels.length + extra;
    })
  );

  constructor() {
    // Seed from URL using names (comma-separated)
    combineLatest([
      this.route.queryParamMap,
      this.allMakes$.pipe(startWith([] as MakeDto[])),
      this.allModels$.pipe(startWith([] as ModelDto[])),
      this.transmissions$.pipe(startWith([] as OptionDto[])),
      this.bodyTypes$.pipe(startWith([] as OptionDto[])),
      this.fuelTypes$.pipe(startWith([] as OptionDto[]))
    ]).subscribe(([q, makes, models, transmissions, bodies, fuels]) => {
      const namesToIds = (param: string | null, list: { id: number; name: string }[]) => {
        if (!param) return [] as number[];
        const wanted = param.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        return list.filter(x => wanted.includes((x.name ?? '').toLowerCase())).map(x => x.id);
      };
      this.selectedMakeIds$.next(namesToIds(q.get('make'), makes));
      this.selectedModelIds$.next(namesToIds(q.get('model'), models));
      this.selectedTransmissionIds$.next(namesToIds(q.get('trans'), transmissions));
      this.selectedBodyTypeIds$.next(namesToIds(q.get('body'), bodies));
      this.selectedFuelTypeIds$.next(namesToIds(q.get('fuel'), fuels));
      const s = q.get('sort'); if (s) this.sort$.next(s);
      const p = q.get('page'); this.page$.next(p ? Number(p) : 1);
    });

    // Persist to URL on changes
    combineLatest([
      this.selectedMakeIds$, this.allMakes$.pipe(startWith([] as MakeDto[])),
      this.selectedModelIds$, this.allModels$.pipe(startWith([] as ModelDto[])),
      this.selectedTransmissionIds$, this.transmissions$.pipe(startWith([] as OptionDto[])),
      this.selectedBodyTypeIds$, this.bodyTypes$.pipe(startWith([] as OptionDto[])),
      this.selectedFuelTypeIds$, this.fuelTypes$.pipe(startWith([] as OptionDto[])),
      this.sort$, this.page$
    ]).pipe(debounceTime(50)).subscribe(([mkIds, makes, mdIds, models, trIds, transmissions, btIds, bodies, fuIds, fuels, sort, page]) => {
      const namesFor = (ids: number[], list: { id: number; name: string }[]) => ids.map(id => list.find(x => x.id === id)?.name).filter(Boolean) as string[];
      const qp: any = {
        make: namesFor(mkIds, makes).join(',') || undefined,
        model: namesFor(mdIds, models).join(',') || undefined,
        trans: namesFor(trIds, transmissions).join(',') || undefined,
        body: namesFor(btIds, bodies).join(',') || undefined,
        fuel: namesFor(fuIds, fuels).join(',') || undefined,
        sort, page
      };
      this.router.navigate([], { queryParams: qp, queryParamsHandling: 'merge' });
    });

    // Reset to first page when filters or sort change
    combineLatest([this.selectedMakeIds$, this.selectedModelIds$, this.selectedTransmissionIds$, this.selectedBodyTypeIds$, this.selectedFuelTypeIds$, this.sort$])
      .pipe(debounceTime(50)).subscribe(() => this.page$.next(1));

    // Reset dependent selections to avoid stale combos
    this.selectedMakeIds$.pipe(distinctUntilChanged()).subscribe(() => {
      this.selectedModelIds$.next([]);
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
  private toggle(ids$: BehaviorSubject<number[]>, id: number) {
    const curr = ids$.value;
    ids$.next(curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]);
  }
  clear(ids$: BehaviorSubject<number[]>) { ids$.next([]); }
  clearAll() {
    this.selectedMakeIds$.next([]);
    this.selectedModelIds$.next([]);
    this.selectedTransmissionIds$.next([]);
    this.selectedBodyTypeIds$.next([]);
    this.selectedFuelTypeIds$.next([]);
    this.priceMin$.next(undefined); this.priceMax$.next(undefined);
    this.yearMin$.next(undefined); this.yearMax$.next(undefined);
    this.mileageMin$.next(undefined); this.mileageMax$.next(undefined);
  }
  toggleMake(id: number) { this.toggle(this.selectedMakeIds$, id); }
  toggleModel(id: number) { this.toggle(this.selectedModelIds$, id); }
  toggleTransmission(id: number) { this.toggle(this.selectedTransmissionIds$, id); }
  toggleBodyType(id: number) { this.toggle(this.selectedBodyTypeIds$, id); }
  toggleFuelType(id: number) { this.toggle(this.selectedFuelTypeIds$, id); }

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
    const bucketStart = v === '' ? undefined : Number(v);
    if (bucketStart == null) { this.mileageMax$.next(undefined); return; }
    combineLatest([this.mileageStep$]).pipe(take(1)).subscribe(([step]) => {
      const end = bucketStart + (step ?? 0) - 1;
      const currentMin = this.mileageMin$.value;
      this.mileageMax$.next(end);
      if (currentMin != null && end < currentMin) {
        this.mileageMin$.next(bucketStart);
      }
    });
  }
}
