import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// DTO interfaces mirroring backend records
export interface MakeDto { id: number; name: string; }
export interface CreateMakeDto { name: string; }
export interface UpdateMakeDto { name?: string; }

export interface ModelDto { id: number; name: string; makeId: number; }
export interface CreateModelDto { name: string; makeId: number; }
export interface UpdateModelDto { name?: string; makeId?: number; }

export interface GenerationDto { id: number; name: string; startYear?: number; endYear?: number; modelId: number; }
export interface CreateGenerationDto { name: string; modelId: number; startYear?: number; endYear?: number; }
export interface UpdateGenerationDto { name?: string; modelId?: number; startYear?: number; endYear?: number; }

export interface VariantDto { id: number; name: string; derivativeId: number; }
export interface CreateVariantDto { name: string; derivativeId: number; }
export interface UpdateVariantDto { name?: string; derivativeId?: number; }

export interface FeatureDto { id: number; name: string; description?: string; }
export interface CreateFeatureDto { name: string; description?: string; }
export interface UpdateFeatureDto { name?: string; description?: string; }

export interface VariantFeatureDto { variantId: number; featureId: number; isStandard: boolean; addedDate: string; }
export interface CreateVariantFeatureDto { variantId: number; featureId: number; isStandard: boolean; }
export interface UpdateVariantFeatureDto { isStandard?: boolean; }

export interface VariantsContextDto {
  makes: MakeDto[];
  models: ModelDto[];
  derivatives: DerivativeDto[];
  generations: GenerationDto[];
  variants: VariantDto[];
}
export interface OptionDto { id: number; name: string; }
export interface VariantOptionsDto { transmissions: OptionDto[]; fuelTypes: OptionDto[]; }

export interface ModelsContextDto {
  makes: MakeDto[];
  models: ModelDto[];
}

export interface GenerationsContextDto {
  makes: MakeDto[];
  models: ModelDto[];
  derivatives: DerivativeDto[];
  generations: GenerationDto[];
}

// VariantFeatures page removed; context DTO no longer needed

// Derivatives
export interface DerivativeDto { id: number; name?: string; modelId: number; generationId?: number; bodyTypeId: number; bodyType?: string; seats: number; doors: number; engine?: string; transmissionId?: number; transmission?: string; fuelTypeId?: number; fuelType?: string; batteryCapacityKWh?: number; }
export interface CreateDerivativeDto { name: string; modelId: number; generationId: number; bodyTypeId: number; seats: number; doors: number; engine?: string; transmissionId?: number; fuelTypeId?: number; batteryCapacityKWh?: number; }
export interface UpdateDerivativeDto { name?: string; modelId?: number; generationId?: number; bodyTypeId?: number; seats?: number; doors?: number; engine?: string; transmissionId?: number; fuelTypeId?: number; batteryCapacityKWh?: number; }
export interface DerivativesContextDto { makes: MakeDto[]; models: ModelDto[]; derivatives: DerivativeDto[]; }
export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  // Use empty base; environment-based interceptor will prefix with the API base (e.g., http://localhost:7005/api)
  private readonly baseUrl = '';

  // Makes
  getMakes(): Observable<MakeDto[]> { return this.http.get<MakeDto[]>(`${this.baseUrl}/makes`); }
  getMake(id: number): Observable<MakeDto> { return this.http.get<MakeDto>(`${this.baseUrl}/makes/${id}`); }
  createMake(dto: CreateMakeDto): Observable<MakeDto> { return this.http.post<MakeDto>(`${this.baseUrl}/makes`, dto); }
  updateMake(id: number, dto: UpdateMakeDto) { return this.http.put(`${this.baseUrl}/makes/${id}`, dto); }
  deleteMake(id: number) { return this.http.delete(`${this.baseUrl}/makes/${id}`); }

  // Models
  getModels(makeId?: number): Observable<ModelDto[]> { const params: any = {}; if (makeId) params.makeId = makeId; return this.http.get<ModelDto[]>(`${this.baseUrl}/models`, { params }); }
  getModelsContext(makeId?: number): Observable<ModelsContextDto> { const params: any = {}; if (makeId) params.makeId = makeId; return this.http.get<ModelsContextDto>(`${this.baseUrl}/models/context`, { params }); }
  getModelsPaged(opts?: { page?: number; pageSize?: number; sort?: string; dir?: 'asc'|'desc'; makeId?: number }): Observable<PagedResult<ModelDto>> {
    const params: any = {};
    if (opts?.page) params.page = opts.page;
    if (opts?.pageSize) params.pageSize = opts.pageSize;
    if (opts?.sort) params.sort = opts.sort;
    if (opts?.dir) params.dir = opts.dir;
    if (opts?.makeId) params.makeId = opts.makeId;
    return this.http.get<PagedResult<ModelDto>>(`${this.baseUrl}/models/paged`, { params });
  }
  createModel(dto: CreateModelDto): Observable<ModelDto> { return this.http.post<ModelDto>(`${this.baseUrl}/models`, dto); }
  updateModel(id: number, dto: UpdateModelDto) { return this.http.put(`${this.baseUrl}/models/${id}`, dto); }
  deleteModel(id: number) { return this.http.delete(`${this.baseUrl}/models/${id}`); }

  // Generations
  getGenerations(modelId?: number): Observable<GenerationDto[]> { const params: any = {}; if (modelId) params.modelId = modelId; return this.http.get<GenerationDto[]>(`${this.baseUrl}/generations`, { params }); }
  getGenerationsContext(makeId?: number, modelId?: number): Observable<GenerationsContextDto> {
    const params: any = {}; if (makeId) params.makeId = makeId; if (modelId) params.modelId = modelId;
    return this.http.get<GenerationsContextDto>(`${this.baseUrl}/generations/context`, { params });
  }
  getGenerationsPaged(opts?: { page?: number; pageSize?: number; sort?: string; dir?: 'asc'|'desc'; makeId?: number; modelId?: number }): Observable<PagedResult<GenerationDto>> {
    const params: any = {};
    if (opts?.page) params.page = opts.page;
    if (opts?.pageSize) params.pageSize = opts.pageSize;
    if (opts?.sort) params.sort = opts.sort;
    if (opts?.dir) params.dir = opts.dir;
    if (opts?.makeId) params.makeId = opts.makeId;
    if (opts?.modelId) params.modelId = opts.modelId;
    return this.http.get<PagedResult<GenerationDto>>(`${this.baseUrl}/generations/paged`, { params });
  }
  createGeneration(dto: CreateGenerationDto): Observable<GenerationDto> { return this.http.post<GenerationDto>(`${this.baseUrl}/generations`, dto); }
  updateGeneration(id: number, dto: UpdateGenerationDto) { return this.http.put(`${this.baseUrl}/generations/${id}`, dto); }
  deleteGeneration(id: number) { return this.http.delete(`${this.baseUrl}/generations/${id}`); }

  // Variants
  getVariants(generationId?: number): Observable<VariantDto[]> { const params: any = {}; if (generationId) params.generationId = generationId; return this.http.get<VariantDto[]>(`${this.baseUrl}/variants`, { params }); }
  getVariantsContext(makeId?: number, modelId?: number, generationId?: number): Observable<VariantsContextDto> {
    const params: any = {};
    if (makeId) params.makeId = makeId;
    if (modelId) params.modelId = modelId;
    if (generationId) params.generationId = generationId;
    return this.http.get<VariantsContextDto>(`${this.baseUrl}/variants/context`, { params });
  }
  getVariantOptions(): Observable<VariantOptionsDto> { return this.http.get<VariantOptionsDto>(`${this.baseUrl}/variants/options`); }
  createVariant(dto: CreateVariantDto): Observable<VariantDto> { return this.http.post<VariantDto>(`${this.baseUrl}/variants`, dto); }
  updateVariant(id: number, dto: UpdateVariantDto) { return this.http.put(`${this.baseUrl}/variants/${id}`, dto); }
  deleteVariant(id: number) { return this.http.delete(`${this.baseUrl}/variants/${id}`); }

  // Features
  getFeatures(): Observable<FeatureDto[]> { return this.http.get<FeatureDto[]>(`${this.baseUrl}/features`); }
  createFeature(dto: CreateFeatureDto): Observable<FeatureDto> { return this.http.post<FeatureDto>(`${this.baseUrl}/features`, dto); }
  updateFeature(id: number, dto: UpdateFeatureDto) { return this.http.put(`${this.baseUrl}/features/${id}`, dto); }
  deleteFeature(id: number) { return this.http.delete(`${this.baseUrl}/features/${id}`); }

  // VariantFeatures
  getVariantFeatures(variantId?: number, featureId?: number): Observable<VariantFeatureDto[]> {
    const params: any = {}; if (variantId) params.variantId = variantId; if (featureId) params.featureId = featureId;
  return this.http.get<VariantFeatureDto[]>(`${this.baseUrl}/variantfeatures`, { params });
  }
  // getVariantFeaturesContext removed as the Variant Features page was deleted
  createVariantFeature(dto: CreateVariantFeatureDto): Observable<VariantFeatureDto> { return this.http.post<VariantFeatureDto>(`${this.baseUrl}/variantfeatures`, dto); }
  updateVariantFeature(variantId: number, featureId: number, dto: UpdateVariantFeatureDto) { return this.http.put(`${this.baseUrl}/variantfeatures/${variantId}/${featureId}`, dto); }
  deleteVariantFeature(variantId: number, featureId: number) { return this.http.delete(`${this.baseUrl}/variantfeatures/${variantId}/${featureId}`); }

  // Derivatives
  getDerivatives(modelId?: number): Observable<DerivativeDto[]> { const params: any = {}; if (modelId) params.modelId = modelId; return this.http.get<DerivativeDto[]>(`${this.baseUrl}/derivatives`, { params }); }
  getDerivativesContext(makeId?: number, modelId?: number): Observable<DerivativesContextDto> { const params: any = {}; if (makeId) params.makeId = makeId; if (modelId) params.modelId = modelId; return this.http.get<DerivativesContextDto>(`${this.baseUrl}/derivatives/context`, { params }); }
  getDerivativesPaged(opts?: { page?: number; pageSize?: number; sort?: string; dir?: 'asc'|'desc'; makeId?: number; modelId?: number }): Observable<PagedResult<DerivativeDto>> {
    const params: any = {};
    if (opts?.page) params.page = opts.page;
    if (opts?.pageSize) params.pageSize = opts.pageSize;
    if (opts?.sort) params.sort = opts.sort;
    if (opts?.dir) params.dir = opts.dir;
    if (opts?.makeId) params.makeId = opts.makeId;
    if (opts?.modelId) params.modelId = opts.modelId;
    return this.http.get<PagedResult<DerivativeDto>>(`${this.baseUrl}/derivatives/paged`, { params });
  }
  getBodyTypeOptions(): Observable<OptionDto[]> { return this.http.get<OptionDto[]>(`${this.baseUrl}/derivatives/options`); }
  createDerivative(dto: CreateDerivativeDto): Observable<DerivativeDto> { return this.http.post<DerivativeDto>(`${this.baseUrl}/derivatives`, dto); }
  updateDerivative(id: number, dto: UpdateDerivativeDto) { return this.http.put(`${this.baseUrl}/derivatives/${id}`, dto); }
  deleteDerivative(id: number) { return this.http.delete(`${this.baseUrl}/derivatives/${id}`); }
}
