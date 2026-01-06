import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MakeDto { id: number; name: string; }
export interface ModelDto { id: number; name: string; makeId: number; }
export interface GenerationDto { id: number; name: string; modelId: number; startYear?: number; endYear?: number; }
export interface DerivativeDto { id: number; name: string; modelId: number; generationId: number; bodyTypeId: number; seats: number; doors: number; engine?: string; transmissionId?: number; fuelTypeId?: number; batteryCapacityKWh?: number; }
export interface VariantDto { id: number; name: string; derivativeId: number; }
export interface OptionDto { id: number; name: string; }
export interface VariantOptionsDto { transmissions: OptionDto[]; fuelTypes: OptionDto[]; bodyTypes: OptionDto[]; }

export interface CreateListingDto {
  title: string; description?: string; year: number; mileage: number; price: number; color?: string;
  makeId: number; modelId: number; generationId: number; derivativeId: number; variantId: number;
  transmissionId?: number; fuelTypeId?: number; bodyTypeId: number;
}

@Injectable({ providedIn: 'root' })
export class ListingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '';

  getMakes(): Observable<MakeDto[]> { return this.http.get<MakeDto[]>(`${this.baseUrl}/references/makes`); }
  getModels(makeId?: number): Observable<ModelDto[]> { const params: any = {}; if (makeId) params.makeId = makeId; return this.http.get<ModelDto[]>(`${this.baseUrl}/references/models`, { params }); }
  getGenerations(modelId?: number): Observable<GenerationDto[]> { const params: any = {}; if (modelId) params.modelId = modelId; return this.http.get<GenerationDto[]>(`${this.baseUrl}/references/generations`, { params }); }
  getDerivatives(modelId?: number): Observable<DerivativeDto[]> { const params: any = {}; if (modelId) params.modelId = modelId; return this.http.get<DerivativeDto[]>(`${this.baseUrl}/references/derivatives`, { params }); }
  getVariants(derivativeId?: number): Observable<VariantDto[]> { const params: any = {}; if (derivativeId) params.derivativeId = derivativeId; return this.http.get<VariantDto[]>(`${this.baseUrl}/references/variants`, { params }); }
  getOptions(): Observable<VariantOptionsDto> { return this.http.get<VariantOptionsDto>(`${this.baseUrl}/references/options`); }

  createListing(dto: CreateListingDto) { return this.http.post(`${this.baseUrl}/listings`, dto); }
}
