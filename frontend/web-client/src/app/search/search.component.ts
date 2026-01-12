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
    this.sort$,
    this.page$,
    this.pageSize$
  ]).pipe(
    debounceTime(100),
    map(([makeIds, modelIds, transmissionIds, bodyTypeIds, fuelTypeIds, sort, page, pageSize]) => ({ makeIds, modelIds, transmissionIds, bodyTypeIds, fuelTypeIds, sort, page, pageSize })),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay(1)
  );

  // Results stream
  readonly results$ = this.query$.pipe(
    tap(() => this.loading$.next(true)),
    switchMap(({ makeIds, modelIds, transmissionIds, bodyTypeIds, fuelTypeIds, sort, page, pageSize }) => {
      const [sortBy, sortDirection] = this.mapSort(sort);
      const params = { makeIds, modelIds, transmissionIds, bodyTypeIds, fuelTypeIds, page, pageSize, sortBy, sortDirection } as const;
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
  private readonly facetCounts$ = this.listings$.pipe(
    map(list => {
      const countBy = (listings: ListingDto[], key: (l: ListingDto) => number | undefined | null) => {
        const m = new Map<number, number>();
        for (const l of listings) {
          const k = key(l);
          if (!k || k <= 0) continue;
          m.set(k, (m.get(k) ?? 0) + 1);
        }
        return m;
      };
      return {
        makes: countBy(list, l => l.makeId),
        models: countBy(list, l => l.modelId),
        transmissions: countBy(list, l => l.transmissionId ?? undefined),
        bodies: countBy(list, l => l.bodyTypeId),
        fuels: countBy(list, l => l.fuelTypeId ?? undefined)
      } as const;
    }),
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

  // Facet count maps for template usage
  readonly makeCounts$ = this.facetCounts$.pipe(map(x => x.makes));
  readonly modelCounts$ = this.facetCounts$.pipe(map(x => x.models));
  readonly transmissionCounts$ = this.facetCounts$.pipe(map(x => x.transmissions));
  readonly bodyCounts$ = this.facetCounts$.pipe(map(x => x.bodies));
  readonly fuelCounts$ = this.facetCounts$.pipe(map(x => x.fuels));

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
  toggleMake(id: number) { this.toggle(this.selectedMakeIds$, id); }
  toggleModel(id: number) { this.toggle(this.selectedModelIds$, id); }
  toggleTransmission(id: number) { this.toggle(this.selectedTransmissionIds$, id); }
  toggleBodyType(id: number) { this.toggle(this.selectedBodyTypeIds$, id); }
  toggleFuelType(id: number) { this.toggle(this.selectedFuelTypeIds$, id); }
}
