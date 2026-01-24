import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface MakeDto { id: number; name: string; code: string; }
export interface ModelDto { id: number; name: string; code: string; makeId: number; }
export interface GenerationDto { id: number; name: string; code: string; modelId: number; startYear?: number; endYear?: number; }
export interface DerivativeDto { id: number; name: string; code: string; modelId: number; generationId: number; bodyTypeId: number; seats: number; doors: number; engineCC?: number; engineL?: number; transmissionId?: number; fuelTypeId?: number; batteryKWh?: number; bodyType?: string; transmission?: string; fuelType?: string; }
export interface VariantDto { id: number; name: string; code: string; derivativeId: number; }
export interface OptionDto { id: number; name: string; code?: string; }
export interface VariantOptionsDto { transmissions: OptionDto[]; fuelTypes: OptionDto[]; bodyTypes: OptionDto[]; }
export interface VariantFeatureSnapshot { variantId: number; featureId: number; isStandard: boolean; }
export interface FeatureDto { id: number; name: string; description?: string; }
export interface ListingDto {
  id: number; title: string; description?: string; year: number; mileage: number; price: number; color?: string;
  makeCode?: string; modelCode?: string; generationCode?: string; derivativeCode?: string; variantCode?: string;
  transmissionTypeCode?: string; fuelTypeCode?: string; bodyTypeCode?: string;
  makeName?: string; modelName?: string; generationName?: string; derivativeName?: string; variantName?: string;
  bodyTypeName?: string; transmissionTypeName?: string; fuelTypeName?: string;
  seats?: number; doors?: number; engineSizeCC?: number; engineL?: number; batteryKWh?: number;
  images?: ListingImageDto[];
  featureIds?: number[];
}

export interface ListingSearchParams {
  makeCode?: string; modelCode?: string; variantCode?: string; transmissionTypeCode?: string; bodyTypeCode?: string; fuelTypeCode?: string;
  makeCodes?: string[]; modelCodes?: string[]; variantCodes?: string[]; transmissionTypeCodes?: string[]; bodyTypeCodes?: string[]; fuelTypeCodes?: string[];
  seats?: number[]; doors?: number[];
  // Ranges
  priceMin?: number; priceMax?: number;
  yearMin?: number; yearMax?: number;
  mileageMin?: number; mileageMax?: number;
  page?: number; pageSize?: number; sortBy?: 'price'|'year'; sortDirection?: 'asc'|'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateListingDto {
  title: string; description?: string; year: number; mileage: number; price: number; color?: string;
  makeCode: string; modelCode: string; generationCode: string; derivativeCode: string; variantCode: string;
  transmissionTypeCode?: string; fuelTypeCode?: string; bodyTypeCode: string;
  // Optional labels (client provides snapshot labels)
  makeName?: string; modelName?: string; generationName?: string; derivativeName?: string; variantName?: string;
  bodyTypeName?: string; transmissionTypeName?: string; fuelTypeName?: string;
  featureIds?: number[];
}

export interface ListingImageDto {
  id: number;
  fileName: string;
  url: string;
  thumbUrl?: string;
}

export interface UpdateListingDto {
  title?: string; description?: string; year?: number; mileage?: number; price?: number; color?: string;
  makeCode?: string; modelCode?: string; generationCode?: string; derivativeCode?: string; variantCode?: string;
  transmissionTypeCode?: string; fuelTypeCode?: string; bodyTypeCode?: string;
  featureIds?: number[];
}

export interface FacetCountsDto {
  makes: Record<string, number>;
  models: Record<string, number>;
  transmissions: Record<string, number>;
  bodies: Record<string, number>;
  fuels: Record<string, number>;
  seats: Record<number, number>;
  doors: Record<number, number>;
  years: Record<number, number>;
  prices: Record<number, number>;
  mileages: Record<number, number>;
  priceStep: number;
  mileageStep: number;
  minMileage?: number;
  mileageExact?: Record<number, number>;
  // Labels and parent mapping from ListingService (snapshots)
  makeLabels?: Record<string, string>;
  modelLabels?: Record<string, string>;
  modelMakeCodes?: Record<string, string>;
  transmissionLabels?: Record<string, string>;
  bodyLabels?: Record<string, string>;
  fuelLabels?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ListingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly catalogBaseUrl = environment.catalogApiBaseUrl;

  // Cached streams for reference data (no params)
  private makesCache$?: Observable<MakeDto[]>;
  private featuresCache$?: Observable<FeatureDto[]>;
  private optionsCache$?: Observable<VariantOptionsDto>;

  // Reference data direct from CatalogService
  getMakes(): Observable<MakeDto[]> {
    if (!this.makesCache$) {
      this.makesCache$ = this.http.get<MakeDto[]>(`${this.catalogBaseUrl}/makes`).pipe(shareReplay(1));
    }
    return this.makesCache$;
  }
  getModels(makeCode?: string): Observable<ModelDto[]> { const params: any = {}; if (makeCode) params.makeCode = makeCode; return this.http.get<ModelDto[]>(`${this.catalogBaseUrl}/models`, { params }); }
  getGenerations(modelCode?: string): Observable<GenerationDto[]> { const params: any = {}; if (modelCode) params.modelCode = modelCode; return this.http.get<GenerationDto[]>(`${this.catalogBaseUrl}/generations`, { params }); }
  getDerivatives(modelCode?: string): Observable<DerivativeDto[]> { const params: any = {}; if (modelCode) params.modelCode = modelCode; return this.http.get<DerivativeDto[]>(`${this.catalogBaseUrl}/derivatives`, { params }); }
  // Variants are filtered by generation in CatalogService
  getVariantsByGeneration(generationCode: string): Observable<VariantDto[]> { const params: any = { generationCode }; return this.http.get<VariantDto[]>(`${this.catalogBaseUrl}/variants`, { params }); }
  // Combine options from two endpoints
  getOptions(): Observable<VariantOptionsDto> {
    if (!this.optionsCache$) {
      this.optionsCache$ = forkJoin({
        varOpts: this.http.get<VariantOptionsDto>(`${this.catalogBaseUrl}/variants/options`),
        bodies: this.http.get<OptionDto[]>(`${this.catalogBaseUrl}/derivatives/options`)
      }).pipe(map(({ varOpts, bodies }) => ({ transmissions: varOpts.transmissions, fuelTypes: varOpts.fuelTypes, bodyTypes: bodies })), shareReplay(1));
    }
    return this.optionsCache$;
  }
  getVariantFeatures(variantId: number): Observable<VariantFeatureSnapshot[]> { return this.http.get<VariantFeatureSnapshot[]>(`${this.catalogBaseUrl}/variantfeatures`, { params: { variantId } as any }); }
  getFeatures(): Observable<FeatureDto[]> {
    if (!this.featuresCache$) {
      this.featuresCache$ = this.http.get<FeatureDto[]>(`${this.catalogBaseUrl}/features`).pipe(shareReplay(1));
    }
    return this.featuresCache$;
  }

  // ListingService endpoints
  getListings(params?: ListingSearchParams): Observable<ListingDto[]> {
    const clean = params ? this.cleanParams(params) : undefined;
    const options = clean ? { params: clean } : {};
    return this.http.get<ListingDto[]>(`${this.baseUrl}/listings`, options);
  }
  searchListings(params: ListingSearchParams): Observable<PaginationResponse<ListingDto>> {
    const clean = this.cleanParams(params);
    return this.http.get<PaginationResponse<ListingDto>>(`${this.baseUrl}/listings/search`, { params: clean });
  }

  getFacetCounts(params: ListingSearchParams): Observable<FacetCountsDto> {
    const clean = this.cleanParams(params);
    return this.http.get<FacetCountsDto>(`${this.baseUrl}/listings/facets`, { params: clean });
  }

  private cleanParams(params: Record<string, any>): Record<string, any> {
    const q: Record<string, any> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        if (v.length === 0) continue; // omit empty arrays to avoid accidental over-filtering
        q[k] = v.map(x => String(x)); // ensure proper serialization as string[]
        continue;
      }
      q[k] = v;
    }
    return q;
  }
  createListing(dto: CreateListingDto) { return this.http.post<ListingDto>(`${this.baseUrl}/listings`, dto); }
  getListing(id: number) { return this.http.get<ListingDto>(`${this.baseUrl}/listings/${id}`); }
  updateListing(id: number, dto: UpdateListingDto) { return this.http.put(`${this.baseUrl}/listings/${id}`, dto); }
  uploadListingImages(listingId: number, files: File[]) {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    return this.http.post(`${this.baseUrl}/listings/${listingId}/images`, fd);
  }
  getListingImages(listingId: number) { return this.http.get(`${this.baseUrl}/listings/${listingId}/images`); }
  deleteListingImage(listingId: number, imageId: number) { return this.http.delete(`${this.baseUrl}/listings/${listingId}/images/${imageId}`); }
  deleteListing(id: number) { return this.http.delete(`${this.baseUrl}/listings/${id}`); }
}
