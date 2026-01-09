import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  Car,
  CarSearchResponse,
  SortOption,
  CarFilters,
  FilterGroup,
  CarSearchRequest,
  CarSearchPaginatedResponse,
  PaginationRequest,
} from '../models/car.model';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CarService {
  private readonly baseUrl = 'http://localhost:5001/api/cars';
  private filterOptionsSubject = new BehaviorSubject<FilterGroup[]>([]);
  // How to encode multi-value query params when sending filters to the API.
  // Options:
  //  - 'csv'     => make=Audi,Kia (default)
  //  - 'repeat'  => make=Audi&make=Kia
  //  - 'brackets'=> make[]=Audi&make[]=Kia
  private multiValueStrategy: 'csv' | 'repeat' | 'brackets' = 'csv';

  filterOptions$ = this.filterOptionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.testApiConnection();
    this.loadFilterOptions();
  }

  // Debug helper: logs current filter options held in the BehaviorSubject
  public logFilterOptions() {
    try {
      const val = this.filterOptionsSubject.getValue();
      console.log('Current filterOptionsSubject value:', val);
    } catch (e) {
      console.warn('Unable to read filterOptionsSubject value:', e);
    }
  }

  // Allow switching multi-value encoding strategy at runtime (useful for debugging)
  public setMultiValueStrategy(strategy: 'csv' | 'repeat' | 'brackets') {
    this.multiValueStrategy = strategy;
    console.log('Multi-value strategy set to:', this.multiValueStrategy);
  }

  /**
   * Test API connection
   */
  private testApiConnection(): void {
    console.log('Testing API connection...');
    this.http.get(`${this.baseUrl}/search?page=1&pageSize=1`).subscribe({
      next: (response) => {
        console.log('✅ API connection successful:', response);
      },
      error: (error) => {
        console.error('❌ API connection failed:', error);
        if (error.status === 0) {
          console.error('This usually means:');
          console.error('1. Backend server is not running');
          console.error('2. CORS is not configured properly');
          console.error('3. Wrong API URL');
        }
      },
    });
  }

  /**
   * Returns an observable of filter options (FilterGroup[])
   */
  getFilterOptions(): Observable<FilterGroup[]> {
    return this.filterOptions$;
  }

  /**
   * Search cars with server-side pagination, filtering, and sorting
   */
  searchCars(request: CarSearchRequest): Observable<CarSearchPaginatedResponse> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.sortBy) {
      params = params.set('sortBy', request.sortBy);
    }
    if (request.sortDirection) {
      params = params.set('sortDirection', request.sortDirection);
    }
    if (request.searchTerm) {
      params = params.set('searchTerm', request.searchTerm);
    }

    // Add filters as query parameters
    if (request.filters) {
      Object.entries(request.filters).forEach(([key, values]) => {
        if (!values || values.length === 0) return;

        switch (this.multiValueStrategy) {
          case 'csv': {
            // key=val1,val2
            const joined = values.join(',');
            params = params.set(key, joined);
            break;
          }
          case 'brackets': {
            // key[]=val1&key[]=val2
            values.forEach((v) => {
              params = params.append(`${key}[]`, v);
            });
            break;
          }
          case 'repeat':
          default: {
            // key=val1&key=val2 (default legacy behavior)
            values.forEach((v) => {
              params = params.append(key, v);
            });
            break;
          }
        }
      });
    }

    console.log('Making API call to:', `${this.baseUrl}/search`);
    console.log('Multi-value encoding strategy:', this.multiValueStrategy);
    console.log('With params:', params.toString());
    console.log('Request object:', request);

    return this.http.get<any>(`${this.baseUrl}/search`, { params }).pipe(
      map((response: any) => {
        console.log('Raw API response:', response);

        // Support PascalCase backend responses (Cars, FilterOptions, TotalCount, HasMoreCars)
        const cars = response.cars || response.Cars || response.data || [];
        const filterOptions = response.filterOptions || response.FilterOptions || [];
        const totalCount = response.totalCount || response.TotalCount || 0;
        const totalPages =
          response.totalPages ||
          response.TotalPages ||
          Math.ceil((totalCount || 0) / (request.pageSize || 1));
        const currentPage = response.currentPage || response.page || request.page;
        const pageSize = response.pageSize || request.pageSize;
        const hasNextPage =
          typeof response.hasNextPage !== 'undefined'
            ? response.hasNextPage
            : !!response.HasMoreCars;
        const hasPreviousPage =
          typeof response.hasPreviousPage !== 'undefined'
            ? response.hasPreviousPage
            : currentPage > 1;

        // Emit filter options if provided by backend so components receive updated facets
        if (filterOptions && Array.isArray(filterOptions) && filterOptions.length > 0) {
          try {
            this.filterOptionsSubject.next(filterOptions);
          } catch (e) {
            console.warn('Failed to emit filter options:', e);
          }
        }

        const mappedResponse: CarSearchPaginatedResponse = {
          data: cars,
          totalCount,
          totalPages,
          currentPage,
          pageSize,
          hasNextPage,
          hasPreviousPage,
          filterOptions,
        };

        console.log('Mapped response:', mappedResponse);
        return mappedResponse;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('API Error:', error);
        if (error.status === 0) {
          console.error('Network error - check if backend is running and CORS is configured');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Load filter options from the server
   */
  private loadFilterOptions(): void {
    console.log('Loading filter options from:', `${this.baseUrl}/filters`);
    this.http
      .get<FilterGroup[]>(`${this.baseUrl}/filters`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Filter options API Error:', error);
          if (error.status === 0) {
            console.error(
              'Network error loading filters - check if backend is running and CORS is configured'
            );
          }
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (filterOptions) => {
          console.log('Filter options received:', filterOptions);
          this.filterOptionsSubject.next(filterOptions);
        },
        error: (err) => {
          console.error('Failed to load filter options:', err);
          // Fallback to empty array if filter options can't be loaded
          this.filterOptionsSubject.next([]);
        },
      });
  }

  /**
   * Returns available sort options for cars
   */
  getSortOptions(): SortOption[] {
    return [
      { label: 'Price: Low to High', value: 'price-asc', field: 'AskingPrice', direction: 'asc' },
      { label: 'Price: High to Low', value: 'price-desc', field: 'AskingPrice', direction: 'desc' },
      { label: 'Year: Newest First', value: 'year-desc', field: 'YearString', direction: 'desc' },
      { label: 'Year: Oldest First', value: 'year-asc', field: 'YearString', direction: 'asc' },
      { label: 'Mileage: Low to High', value: 'mileage-asc', field: 'Mileage', direction: 'asc' },
      { label: 'Mileage: High to Low', value: 'mileage-desc', field: 'Mileage', direction: 'desc' },
    ];
  }

  /**
   * Converts sort option value to sortBy and sortDirection for API
   */
  parseSortOption(sortValue: string): { sortBy?: string; sortDirection?: 'asc' | 'desc' } {
    const sortOption = this.getSortOptions().find((option) => option.value === sortValue);
    if (!sortOption) return {};

    return {
      sortBy: sortOption.field,
      sortDirection: sortOption.direction,
    };
  }

  /**
   * Legacy method for backward compatibility - now uses server-side search
   * @deprecated Use searchCars instead
   */
  getCars(): Observable<Car[]> {
    // Return first page of cars for backward compatibility
    return new Observable((observer) => {
      this.searchCars({ page: 1, pageSize: 1000 }).subscribe({
        next: (response) => observer.next(response.data),
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
  }
}
