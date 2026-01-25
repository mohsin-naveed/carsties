var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingsApiService } from '../listings/listings-api.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, shareReplay, distinctUntilChanged, debounceTime, catchError, startWith, tap, take } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
let SearchComponent = class SearchComponent {
    api = inject(ListingsApiService);
    route = inject(ActivatedRoute);
    router = inject(Router);
    // Sorting options (used in template)
    sortOptions = [
        { label: 'Price: Low to High', value: 'price-asc' },
        { label: 'Price: High to Low', value: 'price-desc' },
        { label: 'Year: Newest', value: 'year-desc' },
        { label: 'Year: Oldest', value: 'year-asc' }
    ];
    // Filter subjects
    selectedMakeCodes$ = new BehaviorSubject([]);
    selectedModelCodes$ = new BehaviorSubject([]);
    selectedTransmissionCodes$ = new BehaviorSubject([]);
    selectedBodyTypeCodes$ = new BehaviorSubject([]);
    selectedFuelTypeCodes$ = new BehaviorSubject([]);
    selectedSeats$ = new BehaviorSubject([]);
    selectedDoors$ = new BehaviorSubject([]);
    // Range filters
    priceMin$ = new BehaviorSubject(undefined);
    priceMax$ = new BehaviorSubject(undefined);
    yearMin$ = new BehaviorSubject(undefined);
    yearMax$ = new BehaviorSubject(undefined);
    mileageMin$ = new BehaviorSubject(undefined);
    mileageMax$ = new BehaviorSubject(undefined);
    // Year dropdown options (1980..current)
    yearStart = 1980;
    yearEnd = new Date().getFullYear();
    yearOptionsAsc = Array.from({ length: (this.yearEnd - this.yearStart + 1) }, (_, i) => this.yearStart + i);
    yearOptionsDesc = [...this.yearOptionsAsc].reverse();
    // Sorting & pagination subjects
    sort$ = new BehaviorSubject('price-asc');
    page$ = new BehaviorSubject(1);
    pageSize$ = new BehaviorSubject(12);
    // Loading indicator
    loading$ = new BehaviorSubject(true);
    // Reference data derived from ListingService facet labels (no Catalog dependency)
    // Facet params and counts (base stream used throughout)
    facetParams$ = combineLatest([
        this.selectedMakeCodes$,
        this.selectedModelCodes$,
        this.selectedTransmissionCodes$,
        this.selectedBodyTypeCodes$,
        this.selectedFuelTypeCodes$,
        this.selectedSeats$,
        this.selectedDoors$,
        this.priceMin$,
        this.priceMax$,
        this.yearMin$,
        this.yearMax$,
        this.mileageMin$,
        this.mileageMax$
    ]).pipe(debounceTime(100), map(([makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax]) => ({ makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax })), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)), shareReplay(1));
    mapFacetDto(dto) {
        return {
            makes: new Map(Object.entries(dto.makes).map(([k, v]) => [String(k), v])),
            models: new Map(Object.entries(dto.models).map(([k, v]) => [String(k), v])),
            transmissions: new Map(Object.entries(dto.transmissions).map(([k, v]) => [String(k), v])),
            bodies: new Map(Object.entries(dto.bodies).map(([k, v]) => [String(k), v])),
            fuels: new Map(Object.entries(dto.fuels).map(([k, v]) => [String(k), v])),
            seats: new Map(Object.entries(dto.seats ?? {}).map(([k, v]) => [Number(k), v])),
            doors: new Map(Object.entries(dto.doors ?? {}).map(([k, v]) => [Number(k), v])),
            years: new Map(Object.entries(dto.years).map(([k, v]) => [Number(k), v])),
            prices: new Map(Object.entries(dto.prices).map(([k, v]) => [Number(k), v])),
            mileages: new Map(Object.entries(dto.mileages).map(([k, v]) => [Number(k), v])),
            priceStep: dto.priceStep,
            mileageStep: dto.mileageStep,
            minMileage: dto.minMileage,
            mileageExact: new Map(Object.entries(dto.mileageExact ?? {}).map(([k, v]) => [Number(k), v])),
            // Labels
            makeLabels: new Map(Object.entries(dto.makeLabels ?? {}).map(([k, v]) => [String(k), String(v)])),
            modelLabels: new Map(Object.entries(dto.modelLabels ?? {}).map(([k, v]) => [String(k), String(v)])),
            modelMakeCodes: new Map(Object.entries(dto.modelMakeCodes ?? {}).map(([k, v]) => [String(k), String(v)])),
            transmissionLabels: new Map(Object.entries(dto.transmissionLabels ?? {}).map(([k, v]) => [String(k), String(v)])),
            bodyLabels: new Map(Object.entries(dto.bodyLabels ?? {}).map(([k, v]) => [String(k), String(v)])),
            fuelLabels: new Map(Object.entries(dto.fuelLabels ?? {}).map(([k, v]) => [String(k), String(v)]))
        };
    }
    // Facet counts & labels from ListingService (single call shared)
    facetCounts$ = this.facetParams$.pipe(switchMap(params => this.api.getFacetCounts(params)), map(dto => this.mapFacetDto(dto)), shareReplay(1));
    // Build options arrays from label maps
    makesAll$ = this.facetCounts$.pipe(map(fc => Array.from((fc.makeLabels ?? new Map()).entries()).map(([code, name]) => ({ code, name }))), shareReplay(1));
    allTransmissions$ = this.facetCounts$.pipe(map(fc => Array.from((fc.transmissionLabels ?? new Map()).entries()).map(([code, name]) => ({ code, name }))), shareReplay(1));
    allBodyTypes$ = this.facetCounts$.pipe(map(fc => Array.from((fc.bodyLabels ?? new Map()).entries()).map(([code, name]) => ({ code, name }))), shareReplay(1));
    allFuelTypes$ = this.facetCounts$.pipe(map(fc => Array.from((fc.fuelLabels ?? new Map()).entries()).map(([code, name]) => ({ code, name }))), shareReplay(1));
    modelsAll$ = this.facetCounts$.pipe(map(fc => {
        const names = fc.modelLabels ?? new Map();
        const parent = fc.modelMakeCodes ?? new Map();
        return Array.from(names.entries()).map(([code, name]) => ({ code, name, makeCode: parent.get(code) ?? '' }));
    }), shareReplay(1));
    // Models depend on selected make
    models$ = combineLatest([this.modelsAll$, this.selectedMakeCodes$]).pipe(map(([all, codes]) => codes.length ? all.filter(m => codes.includes(m.makeCode)) : all), shareReplay(1));
    // Variants filter removed
    // Query params stream
    query$ = combineLatest([
        this.selectedMakeCodes$,
        this.selectedModelCodes$,
        this.selectedTransmissionCodes$,
        this.selectedBodyTypeCodes$,
        this.selectedFuelTypeCodes$,
        this.selectedSeats$,
        this.selectedDoors$,
        this.priceMin$,
        this.priceMax$,
        this.yearMin$,
        this.yearMax$,
        this.mileageMin$,
        this.mileageMax$,
        this.sort$,
        this.page$,
        this.pageSize$
    ]).pipe(debounceTime(100), map(([makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, sort, page, pageSize]) => ({ makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, sort, page, pageSize })), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)), shareReplay(1));
    // Results stream
    results$ = this.query$.pipe(tap(() => this.loading$.next(true)), switchMap(({ makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, sort, page, pageSize }) => {
        const [sortBy, sortDirection] = this.mapSort(sort);
        const params = { makeCodes, modelCodes, transmissionTypeCodes, bodyTypeCodes, fuelTypeCodes, seats, doors, priceMin, priceMax, yearMin, yearMax, mileageMin, mileageMax, page, pageSize, sortBy, sortDirection };
        return this.api.searchListings(params).pipe(catchError(() => this.api.getListings({}).pipe(map(xs => ({ data: xs, totalCount: xs.length, totalPages: Math.max(1, Math.ceil(xs.length / pageSize)), currentPage: page, pageSize })))));
    }), tap(() => this.loading$.next(false)), shareReplay(1));
    // Derived UI streams
    listings$ = this.results$.pipe(map(r => r.data));
    totalCount$ = this.results$.pipe(map(r => r.totalCount));
    totalPages$ = this.results$.pipe(map(r => r.totalPages));
    // Facet counts: server already computes counts ignoring each facet selection within a single response
    // Filtered facet option streams (only show options with count > 0)
    makes$ = combineLatest([this.makesAll$, this.facetCounts$]).pipe(map(([makes, counts]) => makes.filter(m => (counts.makes.get(m.code) ?? 0) > 0)), shareReplay(1));
    // Show only options with count > 0 (but keep currently selected visible)
    transmissions$ = combineLatest([this.allTransmissions$, this.facetCounts$]).pipe(map(([opts, counts]) => opts.filter(t => (counts.transmissions.get(t.code) ?? 0) > 0)), shareReplay(1));
    bodyTypes$ = combineLatest([this.allBodyTypes$, this.facetCounts$]).pipe(map(([opts, counts]) => opts.filter(b => (counts.bodies.get(b.code) ?? 0) > 0)), shareReplay(1));
    fuelTypes$ = combineLatest([this.allFuelTypes$, this.facetCounts$]).pipe(map(([opts, counts]) => opts.filter(f => (counts.fuels.get(f.code) ?? 0) > 0)), shareReplay(1));
    // Seats and Doors counts already ignore their own selection in server response
    seatsCounts$ = this.facetCounts$.pipe(map(x => x.seats));
    doorsCounts$ = this.facetCounts$.pipe(map(x => x.doors));
    // Options show only values with count > 0 (self-excluding counts already applied)
    seats$ = this.seatsCounts$.pipe(map(m => Array.from(m.entries()).filter(([_, c]) => (c ?? 0) > 0).map(([v]) => v).sort((a, b) => a - b)), shareReplay(1));
    doors$ = this.doorsCounts$.pipe(map(m => Array.from(m.entries()).filter(([_, c]) => (c ?? 0) > 0).map(([v]) => v).sort((a, b) => a - b)), shareReplay(1));
    // Models already depend on selected make; apply counts filter too
    filteredModels$ = combineLatest([this.models$, this.facetCounts$]).pipe(map(([models, counts]) => models.filter(m => (counts.models.get(m.code) ?? 0) > 0)), shareReplay(1));
    // Facet collapse preferences and open states (open when any selection is active)
    // Keep Make facet open on initial load
    makePref$ = new BehaviorSubject(true);
    modelPref$ = new BehaviorSubject(false);
    transPref$ = new BehaviorSubject(false);
    bodyPref$ = new BehaviorSubject(false);
    fuelPref$ = new BehaviorSubject(false);
    seatsPref$ = new BehaviorSubject(false);
    doorsPref$ = new BehaviorSubject(false);
    makeOpen$ = combineLatest([this.selectedMakeCodes$, this.makePref$]).pipe(map(([codes, pref]) => (codes.length > 0) ? true : pref), shareReplay(1));
    modelOpen$ = combineLatest([this.selectedModelCodes$, this.modelPref$]).pipe(map(([codes, pref]) => (codes.length > 0) ? true : pref), shareReplay(1));
    transOpen$ = combineLatest([this.selectedTransmissionCodes$, this.transPref$]).pipe(map(([codes, pref]) => (codes.length > 0) ? true : pref), shareReplay(1));
    bodyOpen$ = combineLatest([this.selectedBodyTypeCodes$, this.bodyPref$]).pipe(map(([codes, pref]) => (codes.length > 0) ? true : pref), shareReplay(1));
    fuelOpen$ = combineLatest([this.selectedFuelTypeCodes$, this.fuelPref$]).pipe(map(([codes, pref]) => (codes.length > 0) ? true : pref), shareReplay(1));
    seatsOpen$ = combineLatest([this.selectedSeats$, this.seatsPref$]).pipe(map(([ids, pref]) => (ids.length > 0) ? true : pref), shareReplay(1));
    doorsOpen$ = combineLatest([this.selectedDoors$, this.doorsPref$]).pipe(map(([ids, pref]) => (ids.length > 0) ? true : pref), shareReplay(1));
    toggleMakeFacet() { this.makePref$.next(!this.makePref$.value); }
    toggleModelFacet() { this.modelPref$.next(!this.modelPref$.value); }
    toggleTransmissionFacet() { this.transPref$.next(!this.transPref$.value); }
    toggleBodyFacet() { this.bodyPref$.next(!this.bodyPref$.value); }
    toggleFuelFacet() { this.fuelPref$.next(!this.fuelPref$.value); }
    toggleSeatsFacet() { this.seatsPref$.next(!this.seatsPref$.value); }
    toggleDoorsFacet() { this.doorsPref$.next(!this.doorsPref$.value); }
    // Range facet collapse preferences and open states
    pricePref$ = new BehaviorSubject(false);
    yearPref$ = new BehaviorSubject(false);
    mileagePref$ = new BehaviorSubject(false);
    priceOpen$ = combineLatest([this.priceMin$, this.priceMax$, this.pricePref$]).pipe(map(([min, max, pref]) => ((min != null) || (max != null)) ? true : pref), shareReplay(1));
    yearOpen$ = combineLatest([this.yearMin$, this.yearMax$, this.yearPref$]).pipe(map(([min, max, pref]) => ((min != null) || (max != null)) ? true : pref), shareReplay(1));
    mileageOpen$ = combineLatest([this.mileageMin$, this.mileageMax$, this.mileagePref$]).pipe(map(([min, max, pref]) => ((min != null) || (max != null)) ? true : pref), shareReplay(1));
    togglePriceFacet() { this.pricePref$.next(!this.pricePref$.value); }
    toggleYearFacet() { this.yearPref$.next(!this.yearPref$.value); }
    toggleMileageFacet() { this.mileagePref$.next(!this.mileagePref$.value); }
    // Facet count maps for template usage
    makeCounts$ = this.facetCounts$.pipe(map(x => x.makes));
    modelCounts$ = this.facetCounts$.pipe(map(x => x.models));
    transmissionCounts$ = this.facetCounts$.pipe(map(x => x.transmissions));
    bodyCounts$ = this.facetCounts$.pipe(map(x => x.bodies));
    fuelCounts$ = this.facetCounts$.pipe(map(x => x.fuels));
    // Year counts and option lists derived from server
    yearCounts$ = this.facetCounts$.pipe(map(x => x.years));
    yearValues$ = this.yearCounts$.pipe(map(mapper => Array.from(mapper.keys()).sort((a, b) => b - a)), shareReplay(1));
    fromYearOptions$ = combineLatest([this.yearValues$, this.yearMax$]).pipe(map(([vals, max]) => vals.filter(y => max == null || y <= max)), shareReplay(1));
    toYearOptions$ = combineLatest([this.yearValues$, this.yearMin$]).pipe(map(([vals, min]) => vals.filter(y => min == null || y >= min)), shareReplay(1));
    // Year prefix sums for dynamic range counts (ascending order)
    yearPrefixSums$ = combineLatest([
        this.yearCounts$,
        this.yearCounts$.pipe(map(m => Array.from(m.keys()).sort((a, b) => a - b)))
    ]).pipe(map(([counts, ascYears]) => {
        const prefix = [];
        const index = new Map();
        let sum = 0;
        ascYears.forEach((y, i) => {
            index.set(y, i);
            sum += counts.get(y) ?? 0;
            prefix.push(sum);
        });
        return { sorted: ascYears, prefix, index };
    }), shareReplay(1));
    // From Year counts reflect [from .. currentMax] or >= from
    fromYearCumulativeCounts$ = combineLatest([this.yearPrefixSums$, this.yearMax$]).pipe(map(([prep, maxYear]) => {
        const res = new Map();
        const j = (maxYear != null) ? (prep.index.get(maxYear) ?? -1) : -1;
        for (let i = 0; i < prep.sorted.length; i++) {
            const y = prep.sorted[i];
            if (j >= 0) {
                if (i > j) {
                    res.set(y, 0);
                    continue;
                }
                const left = i > 0 ? prep.prefix[i - 1] : 0;
                const right = prep.prefix[j];
                res.set(y, right - left);
            }
            else {
                const left = i > 0 ? prep.prefix[i - 1] : 0;
                const total = prep.prefix[prep.prefix.length - 1] ?? 0;
                res.set(y, total - left);
            }
        }
        return res;
    }), shareReplay(1));
    // To Year counts reflect [currentMin .. to] or <= to
    toYearCumulativeCounts$ = combineLatest([this.yearPrefixSums$, this.yearMin$]).pipe(map(([prep, minYear]) => {
        const res = new Map();
        const iMin = (minYear != null) ? (prep.index.get(minYear) ?? -1) : -1;
        for (let i = 0; i < prep.sorted.length; i++) {
            const y = prep.sorted[i];
            if (iMin >= 0) {
                if (i < iMin) {
                    res.set(y, 0);
                    continue;
                }
                const left = iMin > 0 ? prep.prefix[iMin - 1] : 0;
                const right = prep.prefix[i];
                res.set(y, right - left);
            }
            else {
                res.set(y, prep.prefix[i]);
            }
        }
        return res;
    }), shareReplay(1));
    // Price counts and option lists derived from server buckets
    priceCounts$ = this.facetCounts$.pipe(map(x => x.prices));
    priceStep$ = this.facetCounts$.pipe(map(x => x.priceStep));
    priceValues$ = this.priceCounts$.pipe(map(mapper => Array.from(mapper.keys()).sort((a, b) => a - b)), shareReplay(1));
    // Precompute prefix sums to support dynamic range counts
    pricePrefixSums$ = combineLatest([this.priceCounts$, this.priceValues$]).pipe(map(([counts, vals]) => {
        const sorted = [...vals].sort((a, b) => a - b);
        const prefix = [];
        const index = new Map();
        let sum = 0;
        sorted.forEach((start, i) => {
            index.set(start, i);
            sum += counts.get(start) ?? 0;
            prefix.push(sum);
        });
        return { sorted, prefix, index };
    }), shareReplay(1));
    // For "From" price, show counts within [from .. currentMax] if max set, else >= from
    fromPriceCumulativeCounts$ = combineLatest([this.pricePrefixSums$, this.priceMax$, this.priceStep$]).pipe(map(([prep, maxEnd, step]) => {
        const res = new Map();
        const maxStart = (maxEnd != null && step) ? (maxEnd - (step - 1)) : undefined;
        const j = (maxStart != null) ? prep.index.get(maxStart) ?? -1 : -1;
        for (let i = 0; i < prep.sorted.length; i++) {
            const start = prep.sorted[i];
            if (j >= 0) {
                if (i > j) {
                    res.set(start, 0);
                    continue;
                }
                const left = i > 0 ? prep.prefix[i - 1] : 0;
                const right = prep.prefix[j];
                res.set(start, right - left);
            }
            else {
                const left = i > 0 ? prep.prefix[i - 1] : 0;
                const total = prep.prefix[prep.prefix.length - 1] ?? 0;
                res.set(start, total - left);
            }
        }
        return res;
    }), shareReplay(1));
    fromPriceOptions$ = combineLatest([this.priceValues$, this.priceMax$, this.priceStep$]).pipe(map(([vals, max, step]) => vals.filter(p => max == null || p <= max)), shareReplay(1));
    toPriceOptions$ = combineLatest([this.priceValues$, this.priceMin$, this.priceStep$]).pipe(map(([vals, min, step]) => vals.filter(p => {
        if (min == null)
            return true;
        const end = p + (step ?? 0) - 1;
        return end >= min;
    })), shareReplay(1));
    // For "To" price, show counts within [currentMin .. to] if min set, else <= to
    toPriceCumulativeCounts$ = combineLatest([this.pricePrefixSums$, this.priceMin$]).pipe(map(([prep, minStart]) => {
        const res = new Map();
        const iMin = (minStart != null) ? (prep.index.get(minStart) ?? -1) : -1;
        for (let i = 0; i < prep.sorted.length; i++) {
            const start = prep.sorted[i];
            if (iMin >= 0) {
                if (i < iMin) {
                    res.set(start, 0);
                    continue;
                }
                const left = iMin > 0 ? prep.prefix[iMin - 1] : 0;
                const right = prep.prefix[i];
                res.set(start, right - left);
            }
            else {
                res.set(start, prep.prefix[i]);
            }
        }
        return res;
    }), shareReplay(1));
    // Mileage counts and option lists derived from server buckets
    mileageCounts$ = this.facetCounts$.pipe(map(x => x.mileages));
    mileageStep$ = this.facetCounts$.pipe(map(x => x.mileageStep));
    minMileage$ = this.facetCounts$.pipe(map(x => x.minMileage));
    mileageExact$ = this.facetCounts$.pipe(map(x => x.mileageExact ?? new Map()));
    mileageValues$ = this.mileageCounts$.pipe(map(mapper => Array.from(mapper.keys()).sort((a, b) => a - b)), shareReplay(1));
    // Overall max mileage cap (max exact or bucket end)
    maxMileageOverall$ = combineLatest([this.mileageExact$, this.mileageValues$, this.mileageStep$]).pipe(map(([exact, bucketStarts, step]) => {
        const maxExact = Array.from(exact.keys()).reduce((mx, k) => Math.max(mx, k), 0);
        const lastStart = bucketStarts.length ? bucketStarts[bucketStarts.length - 1] : 0;
        const maxBucketEnd = (step ?? 0) > 0 ? (lastStart + (step ?? 0) - 1) : lastStart;
        return Math.max(maxExact, maxBucketEnd);
    }), shareReplay(1));
    // Mileage option sequence includes seeds, step increments, and exact mileages present
    mileageOptionValues$ = combineLatest([this.mileageValues$, this.mileageStep$, this.mileageExact$]).pipe(map(([bucketStarts, step, exact]) => {
        const inc = step || 5000;
        const maxStart = bucketStarts.length ? bucketStarts[bucketStarts.length - 1] : 0;
        const maxEnd = maxStart + inc - 1;
        const vals = [];
        const seed = [0, 100, 500, 1000, 2000, 3000, 4000];
        for (const v of seed) {
            if (v <= maxEnd)
                vals.push(v);
        }
        let cur = inc; // start at step (e.g., 5000)
        while (cur <= maxEnd) {
            vals.push(cur);
            cur += inc;
        }
        for (const v of Array.from(exact.keys())) {
            if (v <= maxEnd)
                vals.push(v);
        }
        return Array.from(new Set(vals)).sort((a, b) => a - b);
    }), shareReplay(1));
    fromMileageOptions$ = combineLatest([this.mileageOptionValues$, this.mileageMax$]).pipe(map(([vals, max]) => vals.filter(m => max == null || m <= max)), shareReplay(1));
    // To mileage thousand-step options: start at lowest available thousand (>= minMileage), exclude 0
    toMileageOptions$ = combineLatest([this.minMileage$, this.maxMileageOverall$]).pipe(map(([minAvail, overallMax]) => {
        const start = Math.max(1000, Math.ceil(((minAvail ?? 1)) / 1000) * 1000);
        const cap = Math.max(start, Math.ceil((overallMax ?? 0) / 1000) * 1000);
        const arr = [];
        for (let v = start; v <= cap; v += 1000)
            arr.push(v);
        return arr;
    }), shareReplay(1));
    // Derive selected 'To' bucket start from max using fixed step
    mileageMaxStart$ = combineLatest([this.mileageMax$, this.mileageStep$]).pipe(map(([end, step]) => (end == null || !step) ? undefined : (end - (step - 1))), shareReplay(1));
    // Mileage prefix sums for dynamic range counts
    mileagePrefixSums$ = combineLatest([this.mileageCounts$, this.mileageValues$]).pipe(map(([counts, vals]) => {
        const sorted = [...vals].sort((a, b) => a - b);
        const prefix = [];
        const index = new Map();
        let sum = 0;
        sorted.forEach((start, i) => {
            index.set(start, i);
            sum += counts.get(start) ?? 0;
            prefix.push(sum);
        });
        return { sorted, prefix, index };
    }), shareReplay(1));
    // From Mileage counts reflect [from .. currentMax] or >= from (using bucket start for max)
    fromMileageCumulativeCounts$ = combineLatest([this.mileagePrefixSums$, this.mileageMaxStart$]).pipe(map(([prep, maxStart]) => {
        const res = new Map();
        const j = (maxStart != null) ? (prep.index.get(maxStart) ?? -1) : -1;
        for (let i = 0; i < prep.sorted.length; i++) {
            const m = prep.sorted[i];
            if (j >= 0) {
                if (i > j) {
                    res.set(m, 0);
                    continue;
                }
                const left = i > 0 ? prep.prefix[i - 1] : 0;
                const right = prep.prefix[j];
                res.set(m, right - left);
            }
            else {
                const left = i > 0 ? prep.prefix[i - 1] : 0;
                const total = prep.prefix[prep.prefix.length - 1] ?? 0;
                res.set(m, total - left);
            }
        }
        return res;
    }), shareReplay(1));
    // To Mileage counts reflect [currentMin .. to] or <= to
    toMileageCumulativeCounts$ = combineLatest([this.mileagePrefixSums$, this.mileageMin$]).pipe(map(([prep, minStart]) => {
        const res = new Map();
        const iMin = (minStart != null) ? (prep.index.get(minStart) ?? -1) : -1;
        for (let i = 0; i < prep.sorted.length; i++) {
            const m = prep.sorted[i];
            if (iMin >= 0) {
                if (i < iMin) {
                    res.set(m, 0);
                    continue;
                }
                const left = iMin > 0 ? prep.prefix[iMin - 1] : 0;
                const right = prep.prefix[i];
                res.set(m, right - left);
            }
            else {
                res.set(m, prep.prefix[i]);
            }
        }
        return res;
    }), shareReplay(1));
    // Exact mileage prefix sums for thousand-rounded counts
    mileageExactPrefix$ = this.mileageExact$.pipe(map(exact => {
        const sorted = Array.from(exact.keys()).sort((a, b) => a - b);
        const prefix = [];
        let sum = 0;
        for (const m of sorted) {
            sum += exact.get(m) ?? 0;
            prefix.push(sum);
        }
        return { sorted, prefix };
    }), shareReplay(1));
    // Total cars ignoring mileage (for 0 option on From)
    totalMileageAll$ = this.mileageExactPrefix$.pipe(map(prep => prep.prefix[prep.prefix.length - 1] ?? 0), shareReplay(1));
    // Display counts for From-mileage options using thousand-rounded end; override 0 => total
    fromMileageDisplayCounts$ = combineLatest([
        this.mileageExactPrefix$,
        this.mileageMax$,
        this.fromMileageOptions$,
        this.totalMileageAll$
    ]).pipe(map(([prep, maxSel, opts, totalAll]) => {
        const res = new Map();
        const sumUpTo = (x) => {
            const arr = prep.sorted;
            let lo = 0, hi = arr.length - 1, ans = -1;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (arr[mid] <= x) {
                    ans = mid;
                    lo = mid + 1;
                }
                else {
                    hi = mid - 1;
                }
            }
            return ans >= 0 ? prep.prefix[ans] : 0;
        };
        const endRounded = (maxSel != null) ? Math.ceil(maxSel / 1000) * 1000 : (prep.sorted[prep.sorted.length - 1] ?? 0);
        for (const v of opts) {
            const fromVal = v || 0;
            const c = Math.max(0, sumUpTo(endRounded) - sumUpTo(fromVal - 1));
            res.set(v, c);
        }
        // 0 shows all cars ignoring To
        res.set(0, totalAll);
        return res;
    }), shareReplay(1));
    toMileageDisplayCounts$ = combineLatest([
        this.mileageExactPrefix$,
        this.mileageMin$,
        this.toMileageOptions$
    ]).pipe(map(([prep, min, opts]) => {
        const res = new Map();
        const sumUpTo = (x) => {
            const arr = prep.sorted;
            let lo = 0, hi = arr.length - 1, ans = -1;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (arr[mid] <= x) {
                    ans = mid;
                    lo = mid + 1;
                }
                else {
                    hi = mid - 1;
                }
            }
            return ans >= 0 ? prep.prefix[ans] : 0;
        };
        const minLess = (min != null) ? sumUpTo(min - 1) : 0;
        for (const v of opts) {
            const endRounded = Math.ceil((v || 0) / 1000) * 1000;
            const c = Math.max(0, sumUpTo(endRounded) - minLess);
            res.set(v, c);
        }
        return res;
    }), shareReplay(1));
    // From mileage options filtered to those with non-zero counts (0 included)
    fromMileageOptionsFiltered$ = combineLatest([this.fromMileageOptions$, this.fromMileageDisplayCounts$]).pipe(map(([opts, counts]) => opts.filter(o => (counts.get(o) ?? 0) > 0)), shareReplay(1));
    toMileageOptionsFiltered$ = combineLatest([this.toMileageOptions$, this.toMileageDisplayCounts$, this.minMileage$]).pipe(map(([opts, counts, min]) => {
        const minVal = (min ?? 0);
        return opts.filter(o => o > 0 && o >= minVal && (counts.get(o) ?? 0) > 0);
    }), shareReplay(1));
    // Show stepped From options where counts decrease (plus 0)
    fromMileageOptionsStepped$ = combineLatest([this.fromMileageOptionsFiltered$, this.fromMileageDisplayCounts$]).pipe(map(([opts, counts]) => {
        const sorted = [...opts].sort((a, b) => a - b);
        const result = [];
        let last = undefined;
        for (const v of sorted) {
            const c = counts.get(v) ?? 0;
            if (result.length === 0) {
                result.push(v);
                last = c;
                continue;
            }
            if (last == null || c < last) {
                result.push(v);
                last = c;
            }
        }
        return result;
    }), shareReplay(1));
    fromMileageOptionsVisible$ = this.fromMileageOptionsStepped$;
    toMileageOptionsStepped$ = combineLatest([this.toMileageOptionsFiltered$, this.toMileageDisplayCounts$]).pipe(map(([opts, counts]) => {
        const sorted = [...opts].sort((a, b) => a - b);
        const result = [];
        let last = -1;
        for (const v of sorted) {
            const c = counts.get(v) ?? 0;
            if (result.length === 0) {
                result.push(v);
                last = c;
                continue;
            }
            if (c > last) {
                result.push(v);
                last = c;
            }
        }
        return result;
    }), shareReplay(1));
    // Active filter chips (kind + id/value for removal)
    activeFilterChips$ = combineLatest([
        this.selectedMakeCodes$, this.makes$.pipe(startWith([])),
        this.selectedModelCodes$, this.filteredModels$.pipe(startWith([])),
        this.selectedTransmissionCodes$, this.transmissions$.pipe(startWith([])),
        this.selectedBodyTypeCodes$, this.bodyTypes$.pipe(startWith([])),
        this.selectedFuelTypeCodes$, this.fuelTypes$.pipe(startWith([])),
        this.selectedSeats$, this.seats$.pipe(startWith([])),
        this.selectedDoors$, this.doors$.pipe(startWith([]))
    ]).pipe(map(([mkCodes, makes, mdCodes, models, trCodes, transmissions, btCodes, bodies, fuCodes, fuels, seatVals, seatOpts, doorVals, doorOpts]) => {
        const chips = [];
        const pushNameChips = (codes, list, kind) => {
            codes.forEach(code => {
                const nm = list.find(x => x.code === code)?.name;
                if (nm)
                    chips.push({ kind, code, label: nm });
            });
        };
        pushNameChips(mkCodes, makes, 'make');
        pushNameChips(mdCodes, models, 'model');
        pushNameChips(trCodes, transmissions, 'transmission');
        pushNameChips(btCodes, bodies, 'body');
        pushNameChips(fuCodes, fuels, 'fuel');
        seatVals.forEach(v => chips.push({ kind: 'seats', value: v, label: `${v} seats` }));
        doorVals.forEach(v => chips.push({ kind: 'doors', value: v, label: `${v} doors` }));
        return chips;
    }), shareReplay(1));
    // Count of active filters for quick display (include ranges)
    activeFilterCount$ = combineLatest([
        this.activeFilterChips$,
        this.priceMin$, this.priceMax$,
        this.yearMin$, this.yearMax$,
        this.mileageMin$, this.mileageMax$
    ]).pipe(map(([chips, pmin, pmax, ymin, ymax, mmin, mmax]) => {
        let extra = 0;
        if (pmin != null || pmax != null)
            extra++;
        if (ymin != null || ymax != null)
            extra++;
        if (mmin != null || mmax != null)
            extra++;
        return (chips?.length ?? 0) + extra;
    }));
    constructor() {
        // Seed from URL using names (comma-separated)
        combineLatest([
            this.route.queryParamMap,
            this.makesAll$.pipe(startWith([])),
            this.modelsAll$.pipe(startWith([])),
            this.allTransmissions$.pipe(startWith([])),
            this.allBodyTypes$.pipe(startWith([])),
            this.allFuelTypes$.pipe(startWith([]))
        ]).subscribe(([q, makes, models, transmissions, bodies, fuels]) => {
            const namesToCodes = (param, list) => {
                if (!param)
                    return [];
                const wanted = param.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                return list.filter(x => wanted.includes((x.name ?? '').toLowerCase())).map(x => x.code);
            };
            const numbersFromCsv = (param) => {
                if (!param)
                    return [];
                return param.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
            };
            this.selectedMakeCodes$.next(namesToCodes(q.get('make'), makes));
            this.selectedModelCodes$.next(namesToCodes(q.get('model'), models));
            this.selectedTransmissionCodes$.next(namesToCodes(q.get('trans'), transmissions));
            this.selectedBodyTypeCodes$.next(namesToCodes(q.get('body'), bodies));
            this.selectedFuelTypeCodes$.next(namesToCodes(q.get('fuel'), fuels));
            // Numeric facets and ranges
            this.selectedSeats$.next(numbersFromCsv(q.get('seats')));
            this.selectedDoors$.next(numbersFromCsv(q.get('doors')));
            const toNum = (v) => (v == null || v === '') ? undefined : Number(v);
            this.priceMin$.next(toNum(q.get('pmin')));
            this.priceMax$.next(toNum(q.get('pmax')));
            this.yearMin$.next(toNum(q.get('ymin')));
            this.yearMax$.next(toNum(q.get('ymax')));
            this.mileageMin$.next(toNum(q.get('mmin')));
            this.mileageMax$.next(toNum(q.get('mmax')));
            const s = q.get('sort');
            if (s)
                this.sort$.next(s);
            const p = q.get('page');
            this.page$.next(p ? Number(p) : 1);
        });
        // Persist to URL on changes
        combineLatest([
            this.selectedMakeCodes$, this.makesAll$.pipe(startWith([])),
            this.selectedModelCodes$, this.modelsAll$.pipe(startWith([])),
            this.selectedTransmissionCodes$, this.allTransmissions$.pipe(startWith([])),
            this.selectedBodyTypeCodes$, this.allBodyTypes$.pipe(startWith([])),
            this.selectedFuelTypeCodes$, this.allFuelTypes$.pipe(startWith([])),
            this.selectedSeats$, this.selectedDoors$,
            this.priceMin$, this.priceMax$,
            this.yearMin$, this.yearMax$,
            this.mileageMin$, this.mileageMax$,
            this.sort$, this.page$
        ]).pipe(debounceTime(50)).subscribe(([mkIds, makes, mdIds, models, trIds, transmissions, btIds, bodies, fuIds, fuels, seats, doors, pmin, pmax, ymin, ymax, mmin, mmax, sort, page]) => {
            const namesFor = (codes, list) => codes.map(code => list.find(x => x.code === code)?.name).filter(Boolean);
            const qp = {
                make: namesFor(mkIds, makes).join(',') || undefined,
                model: namesFor(mdIds, models).join(',') || undefined,
                trans: namesFor(trIds, transmissions).join(',') || undefined,
                body: namesFor(btIds, bodies).join(',') || undefined,
                fuel: namesFor(fuIds, fuels).join(',') || undefined,
                seats: (seats?.length ? seats.join(',') : undefined),
                doors: (doors?.length ? doors.join(',') : undefined),
                pmin: (pmin != null ? pmin : undefined),
                pmax: (pmax != null ? pmax : undefined),
                ymin: (ymin != null ? ymin : undefined),
                ymax: (ymax != null ? ymax : undefined),
                mmin: (mmin != null ? mmin : undefined),
                mmax: (mmax != null ? mmax : undefined),
                sort, page
            };
            this.router.navigate([], { queryParams: qp, queryParamsHandling: 'merge' });
        });
        // Reset to first page when filters or sort change
        combineLatest([
            this.selectedMakeCodes$, this.selectedModelCodes$, this.selectedTransmissionCodes$, this.selectedBodyTypeCodes$, this.selectedFuelTypeCodes$,
            this.selectedSeats$, this.selectedDoors$,
            this.priceMin$, this.priceMax$, this.yearMin$, this.yearMax$, this.mileageMin$, this.mileageMax$,
            this.sort$
        ])
            .pipe(debounceTime(50)).subscribe(() => this.page$.next(1));
        // Reset dependent selections to avoid stale combos
        this.selectedMakeCodes$.pipe(distinctUntilChanged()).subscribe(() => {
            this.selectedModelCodes$.next([]);
        });
        // Variant dependency removed
    }
    mapSort(v) {
        switch (v) {
            case 'price-asc': return ['price', 'asc'];
            case 'price-desc': return ['price', 'desc'];
            case 'year-asc': return ['year', 'asc'];
            case 'year-desc': return ['year', 'desc'];
            default: return ['price', 'asc'];
        }
    }
    prevPage() { combineLatest([this.page$, this.totalPages$]).pipe(take(1)).subscribe(([p]) => { if (p > 1)
        this.page$.next(p - 1); }); }
    nextPage() { combineLatest([this.page$, this.totalPages$]).pipe(take(1)).subscribe(([p, t]) => { if (p < t)
        this.page$.next(p + 1); }); }
    // Toggle helpers for multiselect checkboxes
    toggle(ids$, id) {
        const curr = ids$.value;
        ids$.next(curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]);
    }
    clear(ids$) { ids$.next([]); }
    removeFrom(ids$, idOrCode) { ids$.next(ids$.value.filter(x => x !== idOrCode)); }
    clearAll() {
        this.selectedMakeCodes$.next([]);
        this.selectedModelCodes$.next([]);
        this.selectedTransmissionCodes$.next([]);
        this.selectedBodyTypeCodes$.next([]);
        this.selectedFuelTypeCodes$.next([]);
        this.selectedSeats$.next([]);
        this.selectedDoors$.next([]);
        this.priceMin$.next(undefined);
        this.priceMax$.next(undefined);
        this.yearMin$.next(undefined);
        this.yearMax$.next(undefined);
        this.mileageMin$.next(undefined);
        this.mileageMax$.next(undefined);
    }
    toggleMake(code) { this.toggle(this.selectedMakeCodes$, code); }
    toggleModel(code) { this.toggle(this.selectedModelCodes$, code); }
    toggleTransmission(code) { this.toggle(this.selectedTransmissionCodes$, code); }
    toggleBodyType(code) { this.toggle(this.selectedBodyTypeCodes$, code); }
    toggleFuelType(code) { this.toggle(this.selectedFuelTypeCodes$, code); }
    toggleSeat(v) { this.toggle(this.selectedSeats$, v); }
    toggleDoor(v) { this.toggle(this.selectedDoors$, v); }
    // Remove a single active filter via chip close
    removeChip(c) {
        switch (c.kind) {
            case 'make':
                if (c.code != null)
                    this.removeFrom(this.selectedMakeCodes$, c.code);
                break;
            case 'model':
                if (c.code != null)
                    this.removeFrom(this.selectedModelCodes$, c.code);
                break;
            case 'transmission':
                if (c.code != null)
                    this.removeFrom(this.selectedTransmissionCodes$, c.code);
                break;
            case 'body':
                if (c.code != null)
                    this.removeFrom(this.selectedBodyTypeCodes$, c.code);
                break;
            case 'fuel':
                if (c.code != null)
                    this.removeFrom(this.selectedFuelTypeCodes$, c.code);
                break;
            case 'seats':
                if (c.value != null)
                    this.removeFrom(this.selectedSeats$, c.value);
                break;
            case 'doors':
                if (c.value != null)
                    this.removeFrom(this.selectedDoors$, c.value);
                break;
        }
    }
    // Simple illustrative monthly price (placeholder UI affordance)
    monthly(price) { return Math.round((price || 0) / 60); }
    // Year range validation: ensure From <= To by adjusting the opposite side
    onYearMinChange(v) {
        const val = v === '' ? undefined : Number(v);
        const currentMax = this.yearMax$.value;
        this.yearMin$.next(val);
        if (val != null && currentMax != null && val > currentMax) {
            this.yearMax$.next(val);
        }
    }
    onYearMaxChange(v) {
        const val = v === '' ? undefined : Number(v);
        const currentMin = this.yearMin$.value;
        this.yearMax$.next(val);
        if (val != null && currentMin != null && val < currentMin) {
            this.yearMin$.next(val);
        }
    }
    // Price range via bucketed selects: ensure From <= To
    onPriceMinChange(v) {
        const val = v === '' ? undefined : Number(v);
        const currentMax = this.priceMax$.value;
        this.priceMin$.next(val);
        if (val != null && currentMax != null && val > currentMax) {
            this.priceMax$.next(val);
        }
    }
    onPriceMaxChange(v) {
        const bucketStart = v === '' ? undefined : Number(v);
        // Convert bucket start to bucket end using step
        if (bucketStart == null) {
            this.priceMax$.next(undefined);
            return;
        }
        combineLatest([this.priceStep$]).pipe(take(1)).subscribe(([step]) => {
            const end = bucketStart + (step ?? 0) - 1;
            const currentMin = this.priceMin$.value;
            this.priceMax$.next(end);
            if (currentMin != null && end < currentMin) {
                this.priceMin$.next(bucketStart);
            }
        });
    }
    // Mileage range via bucketed selects: ensure From <= To
    onMileageMinChange(v) {
        const val = v === '' ? undefined : Number(v);
        const currentMax = this.mileageMax$.value;
        this.mileageMin$.next(val);
        if (val != null && currentMax != null && val > currentMax) {
            this.mileageMax$.next(val);
        }
    }
    onMileageMaxChange(v) {
        const val = v === '' ? undefined : Number(v);
        if (val == null) {
            this.mileageMax$.next(undefined);
            return;
        }
        const currentMin = this.mileageMin$.value;
        this.mileageMax$.next(val);
        if (currentMin != null && val < currentMin) {
            this.mileageMin$.next(val);
        }
    }
};
SearchComponent = __decorate([
    Component({
        selector: 'app-search',
        standalone: true,
        imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatCardModule, MatProgressBarModule, RouterModule],
        templateUrl: './search.component.html',
        styleUrls: ['./search.component.scss'],
        changeDetection: ChangeDetectionStrategy.OnPush
    }),
    __metadata("design:paramtypes", [])
], SearchComponent);
export { SearchComponent };
//# sourceMappingURL=search.component.js.map