import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface ProvinceDto { id: number; code: string; name: string; createdAt: string; updatedAt: string; }
export interface CityDto { id: number; code: string; name: string; slug: string; provinceId: number; provinceName?: string; createdAt: string; updatedAt: string; }
export interface AreaDto { id: number; code: string; name: string; slug: string; cityId: number; cityName?: string; latitude?: number; longitude?: number; createdAt: string; updatedAt: string; }
export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class LocationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.locationApiBaseUrl;

  searchCities(search: string, provinceId?: number, page = 1, pageSize = 20): Observable<CityDto[]> {
    const params: any = { page, pageSize };
    if (search) params.search = search;
    if (provinceId) params.provinceId = provinceId;
    return this.http.get<PagedResult<CityDto>>(`${this.baseUrl}/cities`, { params }).pipe(map(r => r.items));
  }

  searchAreas(search: string, cityId?: number, page = 1, pageSize = 20): Observable<AreaDto[]> {
    const params: any = { page, pageSize };
    if (search) params.search = search;
    if (cityId) params.cityId = cityId;
    return this.http.get<PagedResult<AreaDto>>(`${this.baseUrl}/areas`, { params }).pipe(map(r => r.items));
  }

  getProvince(id: number): Observable<ProvinceDto> { return this.http.get<ProvinceDto>(`${this.baseUrl}/provinces/${id}`); }
}
