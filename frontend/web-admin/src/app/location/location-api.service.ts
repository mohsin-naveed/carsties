import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface ProvinceDto { id: number; code: string; name: string; createdAt: string; updatedAt: string; }
export interface CreateProvinceDto { name: string; }
export interface UpdateProvinceDto { name?: string; }

export interface CityDto { id: number; code: string; name: string; slug: string; provinceId: number; provinceName?: string; createdAt: string; updatedAt: string; }
export interface CreateCityDto { name: string; provinceId: number; }
export interface UpdateCityDto { name?: string; provinceId?: number; }

export interface AreaDto { id: number; code: string; name: string; slug: string; cityId: number; cityName?: string; latitude?: number; longitude?: number; createdAt: string; updatedAt: string; }
export interface CreateAreaDto { name: string; cityId: number; latitude?: number; longitude?: number; }
export interface UpdateAreaDto { name?: string; cityId?: number; latitude?: number; longitude?: number; }

export interface BulkResultItem { name: string; success: boolean; error?: string; code?: string; slug?: string; id?: number; }
export interface BulkResult { items: BulkResultItem[]; succeeded: number; failed: number; }
export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class LocationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.locationApiBaseUrl.replace(/\/$/, '');
  private readonly cache = new Map<string, Observable<any>>();

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

  // Provinces
  getProvinces(opts?: { page?: number; pageSize?: number; search?: string }): Observable<PagedResult<ProvinceDto>> {
    const params: any = {}; if (opts?.page) params.page = opts.page; if (opts?.pageSize) params.pageSize = opts.pageSize; if (opts?.search) params.search = opts.search;
    return this.cachedGet<PagedResult<ProvinceDto>>(`/provinces`, params);
  }
  createProvince(dto: CreateProvinceDto): Observable<ProvinceDto> { return this.http.post<ProvinceDto>(`${this.baseUrl}/provinces`, dto); }
  updateProvince(id: number, dto: UpdateProvinceDto) { return this.http.put(`${this.baseUrl}/provinces/${id}`, dto); }
  deleteProvince(id: number) { return this.http.delete(`${this.baseUrl}/provinces/${id}`); }

  // Cities
  getCities(opts?: { provinceId?: number; page?: number; pageSize?: number; search?: string }): Observable<PagedResult<CityDto>> {
    const params: any = {}; if (opts?.provinceId) params.provinceId = opts.provinceId; if (opts?.page) params.page = opts.page; if (opts?.pageSize) params.pageSize = opts.pageSize; if (opts?.search) params.search = opts.search;
    return this.cachedGet<PagedResult<CityDto>>(`/cities`, params);
  }
  createCity(dto: CreateCityDto): Observable<CityDto> { return this.http.post<CityDto>(`${this.baseUrl}/cities`, dto); }
  updateCity(id: number, dto: UpdateCityDto) { return this.http.put(`${this.baseUrl}/cities/${id}`, dto); }
  deleteCity(id: number) { return this.http.delete(`${this.baseUrl}/cities/${id}`); }
  bulkCreateCities(names: string, provinceId: number): Observable<BulkResult> { return this.http.post<BulkResult>(`${this.baseUrl}/cities/bulk`, { names, provinceId }); }

  // Areas
  getAreas(opts?: { cityId?: number; page?: number; pageSize?: number; search?: string }): Observable<PagedResult<AreaDto>> {
    const params: any = {}; if (opts?.cityId) params.cityId = opts.cityId; if (opts?.page) params.page = opts.page; if (opts?.pageSize) params.pageSize = opts.pageSize; if (opts?.search) params.search = opts.search;
    return this.cachedGet<PagedResult<AreaDto>>(`/areas`, params);
  }
  createArea(dto: CreateAreaDto): Observable<AreaDto> { return this.http.post<AreaDto>(`${this.baseUrl}/areas`, dto); }
  updateArea(id: number, dto: UpdateAreaDto) { return this.http.put(`${this.baseUrl}/areas/${id}`, dto); }
  deleteArea(id: number) { return this.http.delete(`${this.baseUrl}/areas/${id}`); }
  bulkCreateAreas(names: string, cityId: number): Observable<BulkResult> { return this.http.post<BulkResult>(`${this.baseUrl}/areas/bulk`, { names, cityId }); }
}
