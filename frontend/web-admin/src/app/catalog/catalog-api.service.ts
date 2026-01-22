import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

// DTO interfaces mirroring backend records
export interface MakeDto { id: number; name: string; code: string; slug: string; country?: string; isActive: boolean; isPopular: boolean; }
export interface CreateMakeDto { name: string; country?: string; isActive?: boolean; isPopular?: boolean; slug?: string; }
export interface UpdateMakeDto { name?: string; country?: string; isActive?: boolean; isPopular?: boolean; slug?: string; }

export interface ModelDto { id: number; name: string; code: string; slug: string; makeId: number; isActive: boolean; isPopular: boolean; }
export interface CreateModelDto { name: string; makeId: number; isActive?: boolean; isPopular?: boolean; slug?: string; }
export interface UpdateModelDto { name?: string; makeId?: number; isActive?: boolean; isPopular?: boolean; slug?: string; }

export interface GenerationDto { id: number; name: string; code: string; startYear?: number; endYear?: number; modelId: number; }
export interface CreateGenerationDto { name: string; modelId: number; startYear?: number; endYear?: number; code?: string; }
export interface UpdateGenerationDto { name?: string; modelId?: number; startYear?: number; endYear?: number; code?: string; }

export interface VariantDto { id: number; name: string; code: string; derivativeId: number; isPopular: boolean; isImported: boolean; }
export interface CreateVariantDto { name: string; derivativeId: number; isPopular?: boolean; isImported?: boolean; }
export interface UpdateVariantDto { name?: string; derivativeId?: number; isPopular?: boolean; isImported?: boolean; }

export interface FeatureDto { id: number; name: string; slug: string; description?: string; featureCategoryId: number; featureCategory?: string; }
export interface CreateFeatureDto { name: string; description?: string; featureCategoryId: number; slug?: string; }
export interface UpdateFeatureDto { name?: string; description?: string; featureCategoryId?: number; slug?: string; }

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
export interface DerivativeDto { id: number; code: string; name?: string; modelId: number; generationId?: number; bodyTypeId: number; bodyType?: string; driveTypeId: number; driveType?: string; seats: number; doors: number; engineCC?: number; engineL?: number; transmissionId?: number; transmission?: string; fuelTypeId?: number; fuelType?: string; batteryKWh?: number; isActive: boolean; }
export interface CreateDerivativeDto { name: string; modelId: number; generationId: number; bodyTypeId: number; driveTypeId: number; seats: number; doors: number; engineCC?: number; engineL?: number; transmissionId?: number; fuelTypeId?: number; batteryKWh?: number; isActive?: boolean; }
export interface UpdateDerivativeDto { name?: string; modelId?: number; generationId?: number; bodyTypeId?: number; driveTypeId?: number; seats?: number; doors?: number; engineCC?: number; engineL?: number; transmissionId?: number; fuelTypeId?: number; batteryKWh?: number; isActive?: boolean; }
export interface DerivativesContextDto { makes: MakeDto[]; models: ModelDto[]; derivatives: DerivativeDto[]; }
export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  // Use empty base; environment-based interceptor will prefix with the API base (e.g., http://localhost:7005/api)
  private readonly baseUrl = '';
  private readonly cache = new Map<string, Observable<any>>();

  // Allow pages to invalidate cached GETs after mutations
  invalidateCache(prefix?: string) {
    if (!prefix) { this.cache.clear(); return; }
    const keys = Array.from(this.cache.keys());
    for (const k of keys) if (k.startsWith(prefix)) this.cache.delete(k);
  }

  private cachedGet<T>(path: string, params?: any): Observable<T> {
    const key = `${path}?${JSON.stringify(params || {})}`;
    const cached = this.cache.get(key) as Observable<T> | undefined;
    if (cached) return cached;
    const obs = this.http.get<T>(`${this.baseUrl}${path}`, { params }).pipe(shareReplay(1));
    this.cache.set(key, obs);
    return obs;
  }

  // Makes
  getMakes(): Observable<MakeDto[]> { return this.cachedGet<MakeDto[]>(`/makes`); }
  getMake(id: number): Observable<MakeDto> { return this.http.get<MakeDto>(`${this.baseUrl}/makes/${id}`); }
  createMake(dto: CreateMakeDto): Observable<MakeDto> { return this.http.post<MakeDto>(`${this.baseUrl}/makes`, dto); }
  updateMake(id: number, dto: UpdateMakeDto) { return this.http.put(`${this.baseUrl}/makes/${id}`, dto); }
  deleteMake(id: number) { return this.http.delete(`${this.baseUrl}/makes/${id}`); }

  // Models
  getModels(makeId?: number): Observable<ModelDto[]> { const params: any = {}; if (makeId) params.makeId = makeId; return this.cachedGet<ModelDto[]>(`/models`, params); }
  getModelsContext(makeId?: number): Observable<ModelsContextDto> { const params: any = {}; if (makeId) params.makeId = makeId; return this.cachedGet<ModelsContextDto>(`/models/context`, params); }
  getModelsPaged(opts?: { page?: number; pageSize?: number; sort?: string; dir?: 'asc'|'desc'; makeId?: number }): Observable<PagedResult<ModelDto>> {
    const params: any = {};
    if (opts?.page) params.page = opts.page;
    if (opts?.pageSize) params.pageSize = opts.pageSize;
    if (opts?.sort) params.sort = opts.sort;
    if (opts?.dir) params.dir = opts.dir;
    if (opts?.makeId) params.makeId = opts.makeId;
    return this.cachedGet<PagedResult<ModelDto>>(`/models/paged`, params);
  }
  createModel(dto: CreateModelDto): Observable<ModelDto> { return this.http.post<ModelDto>(`${this.baseUrl}/models`, dto); }
  updateModel(id: number, dto: UpdateModelDto) { return this.http.put(`${this.baseUrl}/models/${id}`, dto); }
  deleteModel(id: number) { return this.http.delete(`${this.baseUrl}/models/${id}`); }

  // Generations
  getGenerations(modelId?: number): Observable<GenerationDto[]> { const params: any = {}; if (modelId) params.modelId = modelId; return this.cachedGet<GenerationDto[]>(`/generations`, params); }
  getGenerationsContext(makeId?: number, modelId?: number): Observable<GenerationsContextDto> {
    const params: any = {}; if (makeId) params.makeId = makeId; if (modelId) params.modelId = modelId;
    return this.cachedGet<GenerationsContextDto>(`/generations/context`, params);
  }
  getGenerationsPaged(opts?: { page?: number; pageSize?: number; sort?: string; dir?: 'asc'|'desc'; makeId?: number; modelId?: number }): Observable<PagedResult<GenerationDto>> {
    const params: any = {};
    if (opts?.page) params.page = opts.page;
    if (opts?.pageSize) params.pageSize = opts.pageSize;
    if (opts?.sort) params.sort = opts.sort;
    if (opts?.dir) params.dir = opts.dir;
    if (opts?.makeId) params.makeId = opts.makeId;
    if (opts?.modelId) params.modelId = opts.modelId;
    return this.cachedGet<PagedResult<GenerationDto>>(`/generations/paged`, params);
  }
  createGeneration(dto: CreateGenerationDto): Observable<GenerationDto> { return this.http.post<GenerationDto>(`${this.baseUrl}/generations`, dto); }
  updateGeneration(id: number, dto: UpdateGenerationDto) { return this.http.put(`${this.baseUrl}/generations/${id}`, dto); }
  deleteGeneration(id: number) { return this.http.delete(`${this.baseUrl}/generations/${id}`); }

  // Variants
  getVariants(generationId?: number): Observable<VariantDto[]> { const params: any = {}; if (generationId) params.generationId = generationId; return this.cachedGet<VariantDto[]>(`/variants`, params); }
  getVariantsContext(makeId?: number, modelId?: number, generationId?: number): Observable<VariantsContextDto> {
    const params: any = {};
    if (makeId) params.makeId = makeId;
    if (modelId) params.modelId = modelId;
    if (generationId) params.generationId = generationId;
    return this.cachedGet<VariantsContextDto>(`/variants/context`, params);
  }
  getVariantsPaged(opts?: { page?: number; pageSize?: number; sort?: string; dir?: 'asc'|'desc'; makeId?: number; modelId?: number; derivativeId?: number }): Observable<PagedResult<VariantDto>> {
    const params: any = {};
    if (opts?.page) params.page = opts.page;
    if (opts?.pageSize) params.pageSize = opts.pageSize;
    if (opts?.sort) params.sort = opts.sort;
    if (opts?.dir) params.dir = opts.dir;
    if (opts?.makeId) params.makeId = opts.makeId;
    if (opts?.modelId) params.modelId = opts.modelId;
    if (opts?.derivativeId) params.derivativeId = opts.derivativeId;
    return this.cachedGet<PagedResult<VariantDto>>(`/variants/paged`, params);
  }
  getVariantOptions(): Observable<VariantOptionsDto> { return this.cachedGet<VariantOptionsDto>(`/variants/options`); }
  createVariant(dto: CreateVariantDto): Observable<VariantDto> { return this.http.post<VariantDto>(`${this.baseUrl}/variants`, dto); }
  updateVariant(id: number, dto: UpdateVariantDto) { return this.http.put(`${this.baseUrl}/variants/${id}`, dto); }
  deleteVariant(id: number) { return this.http.delete(`${this.baseUrl}/variants/${id}`); }

  // Features
  getFeatures(): Observable<FeatureDto[]> { return this.http.get<FeatureDto[]>(`${this.baseUrl}/features`); }
  getFeaturesPaged(opts?: { page?: number; pageSize?: number; sort?: string; dir?: 'asc'|'desc' }): Observable<PagedResult<FeatureDto>> {
    const params: any = {};
    if (opts?.page) params.page = opts.page;
    if (opts?.pageSize) params.pageSize = opts.pageSize;
    if (opts?.sort) params.sort = opts.sort;
    if (opts?.dir) params.dir = opts.dir;
    return this.http.get<PagedResult<FeatureDto>>(`${this.baseUrl}/features/paged`, { params });
  }
  getFeatureCategoryOptions(): Observable<OptionDto[]> { return this.http.get<OptionDto[]>(`${this.baseUrl}/featurecategories/options`); }
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
  getDerivatives(modelId?: number): Observable<DerivativeDto[]> { const params: any = {}; if (modelId) params.modelId = modelId; return this.cachedGet<DerivativeDto[]>(`/derivatives`, params); }
  getDerivativesContext(makeId?: number, modelId?: number): Observable<DerivativesContextDto> { const params: any = {}; if (makeId) params.makeId = makeId; if (modelId) params.modelId = modelId; return this.cachedGet<DerivativesContextDto>(`/derivatives/context`, params); }
  getDerivativesPaged(opts?: { page?: number; pageSize?: number; sort?: string; dir?: 'asc'|'desc'; makeId?: number; modelId?: number }): Observable<PagedResult<DerivativeDto>> {
    const params: any = {};
    if (opts?.page) params.page = opts.page;
    if (opts?.pageSize) params.pageSize = opts.pageSize;
    if (opts?.sort) params.sort = opts.sort;
    if (opts?.dir) params.dir = opts.dir;
    if (opts?.makeId) params.makeId = opts.makeId;
    if (opts?.modelId) params.modelId = opts.modelId;
    return this.cachedGet<PagedResult<DerivativeDto>>(`/derivatives/paged`, params);
  }
  getBodyTypeOptions(): Observable<OptionDto[]> { return this.cachedGet<OptionDto[]>(`/derivatives/options`); }
  getDriveTypeOptions(): Observable<OptionDto[]> { return this.cachedGet<OptionDto[]>(`/drivetypes/options`); }
  createDerivative(dto: CreateDerivativeDto): Observable<DerivativeDto> { return this.http.post<DerivativeDto>(`${this.baseUrl}/derivatives`, dto); }
  updateDerivative(id: number, dto: UpdateDerivativeDto) { return this.http.put(`${this.baseUrl}/derivatives/${id}`, dto); }
  deleteDerivative(id: number) { return this.http.delete(`${this.baseUrl}/derivatives/${id}`); }
}
