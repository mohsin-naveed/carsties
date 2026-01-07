var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
let ListingsApiService = class ListingsApiService {
    http = inject(HttpClient);
    baseUrl = '';
    catalogBaseUrl = environment.catalogApiBaseUrl;
    // Reference data direct from CatalogService
    getMakes() { return this.http.get(`${this.catalogBaseUrl}/makes`); }
    getModels(makeId) { const params = {}; if (makeId)
        params.makeId = makeId; return this.http.get(`${this.catalogBaseUrl}/models`, { params }); }
    getGenerations(modelId) { const params = {}; if (modelId)
        params.modelId = modelId; return this.http.get(`${this.catalogBaseUrl}/generations`, { params }); }
    getDerivatives(modelId) { const params = {}; if (modelId)
        params.modelId = modelId; return this.http.get(`${this.catalogBaseUrl}/derivatives`, { params }); }
    // Variants are filtered by generation in CatalogService
    getVariantsByGeneration(generationId) { const params = { generationId }; return this.http.get(`${this.catalogBaseUrl}/variants`, { params }); }
    // Combine options from two endpoints
    getOptions() {
        return forkJoin({
            varOpts: this.http.get(`${this.catalogBaseUrl}/variants/options`),
            bodies: this.http.get(`${this.catalogBaseUrl}/derivatives/options`)
        }).pipe(map(({ varOpts, bodies }) => ({ transmissions: varOpts.transmissions, fuelTypes: varOpts.fuelTypes, bodyTypes: bodies })));
    }
    getVariantFeatures(variantId) { return this.http.get(`${this.catalogBaseUrl}/variantfeatures`, { params: { variantId } }); }
    // ListingService endpoints
    getListings() { return this.http.get(`${this.baseUrl}/listings`); }
    createListing(dto) { return this.http.post(`${this.baseUrl}/listings`, dto); }
};
ListingsApiService = __decorate([
    Injectable({ providedIn: 'root' })
], ListingsApiService);
export { ListingsApiService };
//# sourceMappingURL=listings-api.service.js.map