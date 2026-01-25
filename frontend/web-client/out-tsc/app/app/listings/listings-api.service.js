var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
let ListingsApiService = class ListingsApiService {
    http = inject(HttpClient);
    baseUrl = environment.apiBaseUrl;
    catalogBaseUrl = environment.catalogApiBaseUrl;
    // Cached streams for reference data (no params)
    makesCache$;
    featuresCache$;
    optionsCache$;
    // Reference data direct from CatalogService
    getMakes() {
        if (!this.makesCache$) {
            this.makesCache$ = this.http.get(`${this.catalogBaseUrl}/makes`).pipe(shareReplay(1));
        }
        return this.makesCache$;
    }
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
        if (!this.optionsCache$) {
            this.optionsCache$ = forkJoin({
                varOpts: this.http.get(`${this.catalogBaseUrl}/variants/options`),
                bodies: this.http.get(`${this.catalogBaseUrl}/derivatives/options`)
            }).pipe(map(({ varOpts, bodies }) => ({ transmissions: varOpts.transmissions, fuelTypes: varOpts.fuelTypes, bodyTypes: bodies })), shareReplay(1));
        }
        return this.optionsCache$;
    }
    getVariantFeatures(variantId) { return this.http.get(`${this.catalogBaseUrl}/variantfeatures`, { params: { variantId } }); }
    getFeatures() {
        if (!this.featuresCache$) {
            this.featuresCache$ = this.http.get(`${this.catalogBaseUrl}/features`).pipe(shareReplay(1));
        }
        return this.featuresCache$;
    }
    // ListingService endpoints
    getListings(params) {
        const clean = params ? this.cleanParams(params) : undefined;
        const options = clean ? { params: clean } : {};
        return this.http.get(`${this.baseUrl}/listings`, options);
    }
    searchListings(params) {
        const clean = this.cleanParams(params);
        return this.http.get(`${this.baseUrl}/listings/search`, { params: clean });
    }
    getFacetCounts(params) {
        const clean = this.cleanParams(params);
        return this.http.get(`${this.baseUrl}/listings/facets`, { params: clean });
    }
    cleanParams(params) {
        const q = {};
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined || v === null)
                continue;
            if (Array.isArray(v)) {
                if (v.length === 0)
                    continue; // omit empty arrays to avoid accidental over-filtering
                q[k] = v.map(x => String(x)); // ensure proper serialization as string[]
                continue;
            }
            q[k] = v;
        }
        return q;
    }
    createListing(dto) { return this.http.post(`${this.baseUrl}/listings`, dto); }
    getListing(id) { return this.http.get(`${this.baseUrl}/listings/${id}`); }
    updateListing(id, dto) { return this.http.put(`${this.baseUrl}/listings/${id}`, dto); }
    uploadListingImages(listingId, files) {
        const fd = new FormData();
        for (const f of files)
            fd.append('files', f);
        return this.http.post(`${this.baseUrl}/listings/${listingId}/images`, fd);
    }
    getListingImages(listingId) { return this.http.get(`${this.baseUrl}/listings/${listingId}/images`); }
    deleteListingImage(listingId, imageId) { return this.http.delete(`${this.baseUrl}/listings/${listingId}/images/${imageId}`); }
    deleteListing(id) { return this.http.delete(`${this.baseUrl}/listings/${id}`); }
};
ListingsApiService = __decorate([
    Injectable({ providedIn: 'root' })
], ListingsApiService);
export { ListingsApiService };
//# sourceMappingURL=listings-api.service.js.map