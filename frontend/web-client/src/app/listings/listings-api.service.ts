import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface MakeDto { id: number; name: string; }
export interface ModelDto { id: number; name: string; makeId: number; }
export interface GenerationDto { id: number; name: string; modelId: number; startYear?: number; endYear?: number; }
export interface DerivativeDto { id: number; name: string; modelId: number; generationId: number; bodyTypeId: number; seats: number; doors: number; engine?: string; transmissionId?: number; fuelTypeId?: number; batteryCapacityKWh?: number; bodyType?: string; transmission?: string; fuelType?: string; }
export interface VariantDto { id: number; name: string; derivativeId: number; }
export interface OptionDto { id: number; name: string; }
export interface VariantOptionsDto { transmissions: OptionDto[]; fuelTypes: OptionDto[]; bodyTypes: OptionDto[]; }
export interface VariantFeatureSnapshot { variantId: number; featureId: number; isStandard: boolean; }
export interface FeatureDto { id: number; name: string; description?: string; }
export interface ListingDto {
  id: number; title: string; description?: string; year: number; mileage: number; price: number; color?: string;
  makeId: number; modelId: number; generationId: number; derivativeId: number; variantId: number;
  transmissionId?: number; fuelTypeId?: number; bodyTypeId: number;
  makeName?: string; modelName?: string; generationName?: string; derivativeName?: string; variantName?: string;
  bodyTypeName?: string; transmissionName?: string; fuelTypeName?: string;
  seatsSnapshot?: number; doorsSnapshot?: number; engineSnapshot?: string; batteryCapacityKWhSnapshot?: number;
  images?: ListingImageDto[];
  featureIds?: number[];
}

export interface ListingSearchParams {
  makeId?: number; modelId?: number; variantId?: number; transmissionId?: number; bodyTypeId?: number; fuelTypeId?: number;
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
  makeId: number; modelId: number; generationId: number; derivativeId: number; variantId: number;
  transmissionId?: number; fuelTypeId?: number; bodyTypeId: number;
  // Snapshots posted from client
  makeName?: string; modelName?: string; generationName?: string; derivativeName?: string; variantName?: string;
  bodyTypeName?: string; transmissionName?: string; fuelTypeName?: string;
  seatsSnapshot?: number; doorsSnapshot?: number; engineSnapshot?: string; batteryCapacityKWhSnapshot?: number;
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
  makeId?: number; modelId?: number; generationId?: number; derivativeId?: number; variantId?: number;
  transmissionId?: number; fuelTypeId?: number; bodyTypeId?: number;
  featureIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class ListingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly catalogBaseUrl = environment.catalogApiBaseUrl;

  // Reference data direct from CatalogService
  getMakes(): Observable<MakeDto[]> { return this.http.get<MakeDto[]>(`${this.catalogBaseUrl}/makes`); }
  getModels(makeId?: number): Observable<ModelDto[]> { const params: any = {}; if (makeId) params.makeId = makeId; return this.http.get<ModelDto[]>(`${this.catalogBaseUrl}/models`, { params }); }
  getGenerations(modelId?: number): Observable<GenerationDto[]> { const params: any = {}; if (modelId) params.modelId = modelId; return this.http.get<GenerationDto[]>(`${this.catalogBaseUrl}/generations`, { params }); }
  getDerivatives(modelId?: number): Observable<DerivativeDto[]> { const params: any = {}; if (modelId) params.modelId = modelId; return this.http.get<DerivativeDto[]>(`${this.catalogBaseUrl}/derivatives`, { params }); }
  // Variants are filtered by generation in CatalogService
  getVariantsByGeneration(generationId: number): Observable<VariantDto[]> { const params: any = { generationId }; return this.http.get<VariantDto[]>(`${this.catalogBaseUrl}/variants`, { params }); }
  // Combine options from two endpoints
  getOptions(): Observable<VariantOptionsDto> {
    return forkJoin({
      varOpts: this.http.get<VariantOptionsDto>(`${this.catalogBaseUrl}/variants/options`),
      bodies: this.http.get<OptionDto[]>(`${this.catalogBaseUrl}/derivatives/options`)
    }).pipe(map(({ varOpts, bodies }) => ({ transmissions: varOpts.transmissions, fuelTypes: varOpts.fuelTypes, bodyTypes: bodies })));
  }
  getVariantFeatures(variantId: number): Observable<VariantFeatureSnapshot[]> { return this.http.get<VariantFeatureSnapshot[]>(`${this.catalogBaseUrl}/variantfeatures`, { params: { variantId } as any }); }
  getFeatures(): Observable<FeatureDto[]> { return this.http.get<FeatureDto[]>(`${this.catalogBaseUrl}/features`); }

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

  private cleanParams(params: Record<string, any>): Record<string, any> {
    const q: Record<string, any> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
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
}
