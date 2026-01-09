// Deep equality check utility (no lodash)
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}
// ...existing imports...
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import {
  Car,
  SortOption,
  CarFilters,
  FilterGroup,
  CarSearchRequest,
  CarSearchPaginatedResponse,
} from '../../models/car.model';
import { CarService } from '../../services/car.service';
import { CarCardComponent } from '../car-card/car-card.component';
import { FilterSidebarComponent } from '../filter-sidebar/filter-sidebar.component';
import { BreadCrumbComponent } from '../bread-crumb/bread-crumb.component';

@Component({
  selector: 'app-find-car',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    CarCardComponent,
    FilterSidebarComponent,
    RouterModule,
    BreadCrumbComponent,
  ],
  templateUrl: './find-car.component.html',
  styleUrls: ['./find-car.component.css'],
})
export class FindCarComponent implements OnInit, OnDestroy {
  // ...existing properties and methods...

  // Handler for mobile filter sidebar output to break feedback loop
  public onStagedMobileFiltersChange(filters: CarFilters) {
    // Only update if truly changed (deep equality)
    if (!deepEqual(this.stagedMobileFilters, filters)) {
      this.stagedMobileFilters = { ...filters };
    }
  }
  private destroy$ = new Subject<void>();

  cars: Car[] = [];
  filterOptions: FilterGroup[] = [];

  // Pagination state from server
  totalCount = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 12;
  hasNextPage = false;
  hasPreviousPage = false;

  selectedSort: string = 'price-asc';
  sortOptions: SortOption[] = [];
  appliedFilters: CarFilters = {};

  // Loading state
  isLoading = false;

  // Pagination array for display
  pages: number[] = [];

  // Mobile overlay state
  showMobileFilters = false;
  showMobileSort = false;

  // For mobile filter overlay: staged filters
  stagedMobileFilters: CarFilters = {};

  constructor(
    public carService: CarService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.sortOptions = this.carService.getSortOptions();

    // Listen for query param changes (for browser navigation)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.appliedFilters = this.filtersFromQueryParams(params);
      this.currentPage = parseInt(params['page']) || 1;
      // If a sort param is present, use it; otherwise default to price-asc
      if (params['sort']) {
        this.selectedSort = params['sort'];
      } else {
        this.selectedSort = 'price-asc';
      }
      this.loadCars();
    });

    // Load filter options
    this.carService
      .getFilterOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((filterOptions) => {
        console.log('Filter options observable emitted:', filterOptions);
        this.filterOptions = filterOptions;
        console.log('Component filterOptions set, length=', this.filterOptions?.length);
      });

    // Debug: log service-held filterOptions shortly after init to catch timing issues
    setTimeout(() => {
      try {
        this.carService.logFilterOptions();
      } catch (e) {
        console.warn('Failed to call logFilterOptions on carService:', e);
      }
    }, 500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load cars from server with current pagination, filters, and sorting
   */
  private loadCars() {
    this.isLoading = true;

    const sortInfo = this.carService.parseSortOption(this.selectedSort);

    const request: CarSearchRequest = {
      page: this.currentPage,
      pageSize: this.pageSize,
      sortBy: sortInfo.sortBy,
      sortDirection: sortInfo.sortDirection,
      filters: this.appliedFilters,
    };

    this.carService.searchCars(request).subscribe({
      next: (response) => {
        console.log('API Response received:', response);
        this.cars = response.data;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.hasNextPage = response.hasNextPage;
        this.hasPreviousPage = response.hasPreviousPage;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.isLoading = false;
        console.log('Component state updated:', {
          cars: this.cars.length,
          totalCount: this.totalCount,
          totalPages: this.totalPages,
        });
      },
      error: (err) => {
        console.error('Failed to load cars:', err);
        this.isLoading = false;
      },
    });
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedSort = target.value;
    // Update sort param in URL and reload
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.route.snapshot.queryParams, sort: this.selectedSort, page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onFiltersChange(filters: CarFilters) {
    this.appliedFilters = filters;
    this.currentPage = 1; // Reset to first page when filters change

    // Check if all filters are empty
    const allEmpty = Object.values(filters).every((arr) => !arr || arr.length === 0);
    if (allEmpty) {
      // Clear all query params except sort
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { sort: this.selectedSort },
        replaceUrl: true,
      });
    } else {
      // Update the URL query string
      const queryParams = {
        ...this.filtersToQueryParams(filters),
        sort: this.selectedSort,
        page: 1,
      };
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl: true,
      });
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    // Update page param in URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.route.snapshot.queryParams, page: page },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    // Scroll to top of car list
    document.querySelector('.car-grid')?.scrollIntoView({ behavior: 'smooth' });
  }

  private filtersToQueryParams(filters: CarFilters): { [key: string]: any } {
    const params: { [key: string]: any } = {};
    Object.keys(filters).forEach((key) => {
      if (Array.isArray(filters[key]) && filters[key].length > 0) {
        params[key] = filters[key];
      }
    });
    return params;
  }

  /**
   * Converts query params to CarFilters object
   */
  private filtersFromQueryParams(params: { [key: string]: any }): CarFilters {
    const filters: CarFilters = {};
    Object.keys(params).forEach((key) => {
      // Skip non-filter params
      if (key === 'sort' || key === 'page') return;

      const value = params[key];
      if (Array.isArray(value)) {
        filters[key] = value;
      } else if (typeof value === 'string') {
        filters[key] = [value];
      }
    });
    return filters;
  }

  // --- Pagination and template helpers ---
  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  openMobileFilters() {
    // Deep clone current applied filters to staged filters
    this.stagedMobileFilters = JSON.parse(JSON.stringify(this.appliedFilters));
    this.showMobileFilters = true;
  }

  cancelMobileFilters() {
    this.showMobileFilters = false;
  }

  applyMobileFilters() {
    this.onFiltersChange(this.stagedMobileFilters);
    this.showMobileFilters = false;
  }

  openMobileSort() {
    this.showMobileSort = true;
  }

  closeMobileSort() {
    this.showMobileSort = false;
  }

  // Returns the total count for staged filters (for mobile popup)
  // Note: This would require a separate API call to get count, for now return current total
  getStagedFilteredCount(): number {
    return this.totalCount;
  }
}
