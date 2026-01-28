import { Component, inject, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, shareReplay, switchMap, take } from 'rxjs/operators';
import { ListingsApiService } from '../listings/listings-api.service';

@Component({
  selector: 'app-hero-search',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './hero-search.component.html',
  styleUrls: ['./hero-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class HeroSearchComponent {
  private readonly api = inject(ListingsApiService);
  private readonly router = inject(Router);

  readonly make$ = new BehaviorSubject<string | undefined>(undefined);
  readonly model$ = new BehaviorSubject<string | undefined>(undefined);
  readonly maxPrice$ = new BehaviorSubject<number | undefined>(undefined);

  // Determine maximum available price from listings to build dropdown options
  private readonly maxAvailablePrice$ = this.api.searchListings({ page: 1, pageSize: 1, sortBy: 'price', sortDirection: 'desc' }).pipe(
    map(r => {
      const top = Array.isArray(r.data) && r.data.length ? r.data[0] : undefined;
      const price = (top as any)?.price as number | undefined;
      return price && price > 0 ? price : 0;
    }),
    shareReplay(1)
  );

  readonly priceOptions$ = this.maxAvailablePrice$.pipe(
    map(max => {
      const ceil = Math.ceil(max / 1000) * 1000;
      const arr: number[] = [];
      for (let p = 1000; p <= ceil; p += 1000) arr.push(p);
      return arr;
    }),
    shareReplay(1)
  );

  private readonly facetParams$ = combineLatest([this.make$, this.model$, this.maxPrice$]).pipe(
    debounceTime(150),
    map(([makeCode, modelCode, priceMax]) => ({ makeCodes: makeCode ? [makeCode] : [], modelCodes: modelCode ? [modelCode] : [], priceMax })),
    distinctUntilChanged((a,b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay(1)
  );

  private readonly facetCounts$ = this.facetParams$.pipe(
    switchMap(params => this.api.getFacetCounts(params)),
    map(dto => ({
      makes: new Map<string, number>(Object.entries(dto.makes)),
      models: new Map<string, number>(Object.entries(dto.models)),
      makeLabels: new Map<string, string>(Object.entries(dto.makeLabels ?? {})),
      modelLabels: new Map<string, string>(Object.entries(dto.modelLabels ?? {})),
      modelMakeCodes: new Map<string, string>(Object.entries(dto.modelMakeCodes ?? {}))
    })),
    shareReplay(1)
  );

  readonly makes$ = this.facetCounts$.pipe(
    map(fc => Array.from(fc.makeLabels.entries())
      .map(([code, name]) => ({ code, name, count: fc.makes.get(code) ?? 0 }))
      .filter(x => x.count > 0)
      .sort((a,b) => b.count - a.count)
    ),
    shareReplay(1)
  );

  private readonly allModels$ = this.facetCounts$.pipe(
    map(fc => Array.from(fc.modelLabels.entries()).map(([code, name]) => ({ code, name, makeCode: fc.modelMakeCodes.get(code) ?? '' }))),
    shareReplay(1)
  );

  readonly models$ = combineLatest([this.allModels$, this.make$, this.facetCounts$]).pipe(
    map(([all, makeCode, fc]) => {
      const filtered = makeCode ? all.filter(m => m.makeCode === makeCode) : all;
      return filtered
        .map(m => ({ ...m, count: fc.models.get(m.code) ?? 0 }))
        .filter(x => x.count > 0)
        .sort((a,b) => b.count - a.count);
    }),
    shareReplay(1)
  );

  // Query server to get total count for the button
  readonly totalCount$ = this.facetParams$.pipe(
    switchMap(params => this.api.searchListings({ ...params, page: 1, pageSize: 1 })),
    map(r => r.totalCount),
    shareReplay(1)
  );

  onSearch() {
    const make = this.make$.value; const model = this.model$.value;
    const priceMax = this.maxPrice$.value;
    const query: any = {};
    if (make) query.makeCodes = [make];
    if (model) query.modelCodes = [model];
    if (priceMax != null) query.priceMax = priceMax;
    this.router.navigate(['/search'], { queryParams: query });
  }

  constructor() { }
}
