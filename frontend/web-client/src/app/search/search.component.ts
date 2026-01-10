import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingsApiService, ListingDto, MakeDto, ModelDto, VariantDto, OptionDto } from '../listings/listings-api.service';
import { forkJoin } from 'rxjs';
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
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  private api = inject(ListingsApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Filters
  makes = signal<MakeDto[]>([]);
  models = signal<ModelDto[]>([]);
  variants = signal<VariantDto[]>([]);
  transmissions = signal<OptionDto[]>([]);
  bodyTypes = signal<OptionDto[]>([]);
  fuelTypes = signal<OptionDto[]>([]);

  selectedMakeId = signal<number | null>(null);
  selectedModelId = signal<number | null>(null);
  selectedVariantId = signal<number | null>(null);
  selectedTransmissionId = signal<number | null>(null);
  selectedBodyTypeId = signal<number | null>(null);
  selectedFuelTypeId = signal<number | null>(null);

  // Listings + pagination
  allListings = signal<ListingDto[]>([]);
  loading = signal<boolean>(true);
  page = signal<number>(1);
  pageSize = signal<number>(12);
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);
  // Sorting
  selectedSort = signal<string>('price-asc');
  sortOptions = [
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Year: Newest', value: 'year-desc' },
    { label: 'Year: Oldest', value: 'year-asc' }
  ];

  anyFilterActive = computed(() => !!(
    this.selectedMakeId() || this.selectedModelId() || this.selectedVariantId() ||
    this.selectedTransmissionId() || this.selectedBodyTypeId() || this.selectedFuelTypeId()
  ));

  filteredListings = computed(() => {
    // Server returns already filtered + sorted data for the current page
    return this.allListings();
  });

  constructor() {
    // Load initial data
    this.fetch();
    this.api.getMakes().subscribe(xs => this.makes.set(xs));
    this.api.getOptions().subscribe(opts => {
      this.transmissions.set(opts.transmissions);
      this.bodyTypes.set(opts.bodyTypes);
      this.fuelTypes.set(opts.fuelTypes);
    });

    // React to Make selection -> load Models
    effect(() => {
      const mk = this.selectedMakeId();
      this.selectedModelId.set(null);
      this.models.set([]);
      this.variants.set([]);
      this.selectedVariantId.set(null);
      if (mk) {
        this.api.getModels(mk).subscribe(xs => this.models.set(xs));
      }
    });

    // React to Model selection -> load Variants across generations
    effect(() => {
      const mdl = this.selectedModelId();
      this.variants.set([]);
      this.selectedVariantId.set(null);
      if (mdl) {
        this.api.getGenerations(mdl).subscribe(gens => {
          if (!gens || gens.length === 0) { this.variants.set([]); return; }
            const obs = gens.map(g => this.api.getVariantsByGeneration(g.id));
            // Combine all variants from all generations
            forkJoin(obs).subscribe({
              next: results => { this.variants.set(results.flat()); },
              error: _ => { this.variants.set([]); }
            });
        });
      }
    });

    // Read initial filters from URL
    this.route.queryParamMap.subscribe(q => {
      const getNum = (key: string) => {
        const v = q.get(key); return v ? Number(v) : null;
      };
      this.selectedMakeId.set(getNum('make'));
      this.selectedModelId.set(getNum('model'));
      this.selectedVariantId.set(getNum('variant'));
      this.selectedTransmissionId.set(getNum('trans'));
      this.selectedBodyTypeId.set(getNum('body'));
      this.selectedFuelTypeId.set(getNum('fuel'));
      const qpSort = q.get('sort');
      if (qpSort) this.selectedSort.set(qpSort);
      const qpPage = q.get('page');
      this.page.set(qpPage ? Number(qpPage) : 1);
    });

    // Persist filters to URL when they change
    effect(() => {
      const qp: any = {
        make: this.selectedMakeId(),
        model: this.selectedModelId(),
        variant: this.selectedVariantId(),
        trans: this.selectedTransmissionId(),
        body: this.selectedBodyTypeId(),
        fuel: this.selectedFuelTypeId(),
        sort: this.selectedSort(),
        page: this.page()
      };
      // Remove nulls for cleaner URLs
      Object.keys(qp).forEach(k => qp[k] === null && delete qp[k]);
      this.router.navigate([], { queryParams: qp, queryParamsHandling: 'merge' });
    });

    // Trigger server search on filters, sort, page or pageSize changes
    effect(() => {
      // Reset to first page when filters or sort change
      const mk = this.selectedMakeId();
      const md = this.selectedModelId();
      const vr = this.selectedVariantId();
      const tr = this.selectedTransmissionId();
      const bt = this.selectedBodyTypeId();
      const fu = this.selectedFuelTypeId();
      const srt = this.selectedSort();
      // Intentionally reference to create dependencies
      void mk; void md; void vr; void tr; void bt; void fu; void srt;
      this.page.set(1);
    });

    effect(() => {
      const p = this.page();
      const ps = this.pageSize();
      void ps;
      // Fetch page when page number changes
      this.fetch();
    });
  }

  private fetch() {
    const [sortBy, sortDirection] = this.mapSort(this.selectedSort());
    const params = {
      makeId: this.selectedMakeId() ?? undefined,
      modelId: this.selectedModelId() ?? undefined,
      variantId: this.selectedVariantId() ?? undefined,
      transmissionId: this.selectedTransmissionId() ?? undefined,
      bodyTypeId: this.selectedBodyTypeId() ?? undefined,
      fuelTypeId: this.selectedFuelTypeId() ?? undefined,
      page: this.page(),
      pageSize: this.pageSize(),
      sortBy,
      sortDirection
    } as const;
    this.loading.set(true);
    this.api.searchListings(params).subscribe({
      next: res => {
        this.allListings.set(res.data);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: _ => {
        // Fallback to non-paginated endpoint to avoid empty UI if /search is unavailable
        const fallbackParams: any = {
          makeId: params.makeId,
          modelId: params.modelId,
          variantId: params.variantId,
          transmissionId: params.transmissionId,
          bodyTypeId: params.bodyTypeId,
          fuelTypeId: params.fuelTypeId
        };
        this.api.getListings(fallbackParams).subscribe({
          next: xs => {
            this.allListings.set(xs);
            this.totalCount.set(xs.length);
            const pages = Math.max(1, Math.ceil(xs.length / this.pageSize()));
            this.totalPages.set(pages);
            // Slice client-side to current page for display
            const start = (this.page() - 1) * this.pageSize();
            const end = start + this.pageSize();
            this.allListings.set(xs.slice(start, end));
            this.loading.set(false);
          },
          error: __ => { this.loading.set(false); }
        });
      }
    });
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

  prevPage() { if (this.page() > 1) this.page.set(this.page() - 1); }
  nextPage() { if (this.page() < this.totalPages()) this.page.set(this.page() + 1); }
}
