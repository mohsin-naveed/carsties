// Deep equality check utility (no lodash)
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterGroup, CarFilters } from '../../models/car.model';
import { CarService } from '../../services/car.service';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.css'],
})
export class FilterSidebarComponent implements OnInit, OnChanges, OnDestroy {
  private destroyed = false;
  ngOnDestroy() {
    this.destroyed = true;
    if (this.emitDebounceTimer) {
      clearTimeout(this.emitDebounceTimer);
      this.emitDebounceTimer = null;
    }
  }
  @Input() filterOptions: FilterGroup[] = [];
  @Input() filteredCars: any[] = [];
  @Input() appliedFilters: CarFilters = {};
  @Output() filtersChange = new EventEmitter<CarFilters>();

  allCars: any[] = [];
  dynamicFilterOptions: FilterGroup[] = [];
  modelOptions: string[] = [];
  // Year range UI
  yearFromOptions: { Year: number; Count: number; Label: string }[] = [];
  yearToOptions: { Year: number; Count: number; Label: string }[] = [];
  selectedYearFrom: number | null = null;
  selectedYearTo: number | null = null;
  // Price range UI
  priceFromOptions: { Price: number; Count: number; Label: string }[] = [];
  priceToOptions: { Price: number; Count: number; Label: string }[] = [];
  selectedPriceFrom: number | null = null;
  selectedPriceTo: number | null = null;

  selectedFilters: CarFilters = {};
  expandedSections: { [key: string]: boolean } = {};
  userToggledSections: { [key: string]: boolean } = {};
  // Keep last emitted filters snapshot to avoid emitting identical filter objects repeatedly
  private lastEmittedFiltersJson: string = '';
  private _lastEmittedFiltersObj: any = undefined;
  private emitDebounceTimer: any = null;
  private EMIT_DEBOUNCE_MS = 50;
  // Optional runtime debug flag: set window.__FILTER_DEBUG__ = true in browser console to enable
  private debugEnabled(): boolean {
    try {
      return typeof window !== 'undefined' && (window as any).__FILTER_DEBUG__ === true;
    } catch {
      return false;
    }
  }

  constructor(private carService: CarService) {}
  ngOnChanges(changes: SimpleChanges) {
    // If backend provided filterOptions after init, ensure we respond to them
    if (changes['filterOptions'] && changes['filterOptions'].currentValue) {
      // Ensure internal structures are updated when filterOptions change
      try {
        // Normalize parents to lowercase for internal consistency
        this.filterOptions = (changes['filterOptions'].currentValue || []).map((g: any) => ({
          Parent: String(g.Parent).toLowerCase(),
          Options: g.Options || [],
        }));
      } catch (e) {
        console.warn('Failed to normalize incoming filterOptions:', e);
      }

      // Initialize selectedFilters keys if not present
      if (!this.selectedFilters || Object.keys(this.selectedFilters || {}).length === 0) {
        this.selectedFilters = this.selectedFilters || {};
        this.filterOptions.forEach((group) => {
          const p = String(group.Parent).toLowerCase();
          if (!Array.isArray(this.selectedFilters[p])) {
            this.selectedFilters[p] = [];
          }
        });
      }

      // Update dependent UI pieces
      this.updateModelOptions();
      this.recalculateFilterOptions();
      this.updateExpandedSections();
    }
    if (changes['appliedFilters'] && changes['appliedFilters'].currentValue) {
      // Normalize incoming appliedFilters keys to lowercase for internal consistency
      const incoming: CarFilters = JSON.parse(JSON.stringify(this.appliedFilters || {}));
      // Compare with current selectedFilters; if same, do nothing
      const normCurrent: CarFilters = {};
      Object.keys(this.selectedFilters || {}).forEach((k) => {
        normCurrent[k.toLowerCase()] = Array.isArray(this.selectedFilters[k])
          ? this.selectedFilters[k]
          : [this.selectedFilters[k]];
      });
      const normIncoming: CarFilters = {};
      Object.keys(incoming).forEach((k) => {
        normIncoming[k.toLowerCase()] = Array.isArray(incoming[k]) ? incoming[k] : [incoming[k]];
      });
      if (JSON.stringify(normCurrent) === JSON.stringify(normIncoming)) {
        // No change, do not update or emit
        return;
      }
      this.selectedFilters = normIncoming;
      // Restore price range selection from appliedFilters if present
      if (
        normIncoming['price'] &&
        Array.isArray(normIncoming['price']) &&
        normIncoming['price'].length === 2
      ) {
        const [from, to] = normIncoming['price'];
        this.selectedPriceFrom = from !== undefined ? Number(from) : null;
        this.selectedPriceTo = to !== undefined ? Number(to) : null;
      }
    }
    if (changes['filteredCars'] && changes['filteredCars'].currentValue) {
      this.recalculateFilterOptions();
    }
    this.updateExpandedSections();
  }

  ngOnInit() {
    this.carService.getCars().subscribe((cars) => {
      this.allCars = cars || [];
      this.updateModelOptions();
      this.recalculateFilterOptions();
      this.updateExpandedSections();
    });

    // Initialize selectedFilters with lowercase keys so internal code is consistent
    this.selectedFilters = this.selectedFilters || {};
    if (!this.appliedFilters || Object.keys(this.appliedFilters).length === 0) {
      this.selectedFilters = {};
      this.filterOptions.forEach((group) => {
        this.selectedFilters[String(group.Parent).toLowerCase()] = [];
      });
    }
    // Restore price range selection from appliedFilters if present
    if (
      this.appliedFilters &&
      Array.isArray(this.appliedFilters['price']) &&
      this.appliedFilters['price'].length === 2
    ) {
      const [from, to] = this.appliedFilters['price'];
      this.selectedPriceFrom = from !== undefined ? Number(from) : null;
      this.selectedPriceTo = to !== undefined ? Number(to) : null;
    }
    this.updateExpandedSections();
  }

  isFilterSelected(parent: string, optionSlug: string): boolean {
    return (
      Array.isArray(this.selectedFilters[parent]) &&
      this.selectedFilters[parent].includes(optionSlug)
    );
  }

  updateExpandedSections() {
    const groups =
      this.dynamicFilterOptions && this.dynamicFilterOptions.length > 0
        ? this.dynamicFilterOptions
        : this.filterOptions;
    if (!groups) return;
    groups.forEach((group) => {
      const hasSelected =
        Array.isArray(this.selectedFilters[group.Parent]) &&
        this.selectedFilters[group.Parent].length > 0;
      if (hasSelected) {
        this.expandedSections[group.Parent] = true;
      } else if (!this.userToggledSections[group.Parent]) {
        this.expandedSections[group.Parent] = false;
      }
    });
  }

  // Helper: normalize for comparisons
  private normalize = (v: any) =>
    v === undefined || v === null ? '' : String(v).toLowerCase().trim();

  // Compute cars that match all selectedFilters except for excludeKey
  private getFilteredCarsExcluding(excludeKey?: string) {
    return this.allCars.filter((car) => {
      for (const key of Object.keys(this.selectedFilters || {})) {
        if (key === excludeKey) continue;
        const sel = this.selectedFilters[key];
        if (!Array.isArray(sel) || sel.length === 0) continue;
        if (key === 'features') {
          const carFeatures: string[] = (car.Features || [])
            .map((f: any) => f.FeatureType?.FriendlyName)
            .filter(Boolean);
          const selNorm = sel.map(this.normalize);
          const hasAny = carFeatures.some((cf) => selNorm.includes(this.normalize(cf)));
          if (!hasAny) return false;
        } else if (key === 'year') {
          // Year comparison: be tolerant for numeric vs string representations
          const carYear = String((car as any)[this.mapKeyToCarField(key)]).trim();
          const selNorm = sel.map((s: any) => String(s).trim());
          // Direct string match
          if (selNorm.includes(carYear)) continue;
          // Numeric fallback: compare numeric values
          const carYearNum = parseInt(carYear);
          const selNums = selNorm.map((s: string) => parseInt(s)).filter((n) => !isNaN(n));
          if (selNums.length > 0 && selNums.includes(carYearNum)) continue;
          return false;
        } else if (key === 'price') {
          // Price range: selected values are [from, to] as strings
          const carValRaw = (car as any)[this.mapKeyToCarField(key)];
          const carPrice = Number(carValRaw);
          if (isNaN(carPrice)) return false;
          if (!Array.isArray(sel) || sel.length < 2) return false;
          const minSel = Number(sel[0]);
          const maxSel = Number(sel[1]);
          if (isNaN(minSel) || isNaN(maxSel)) return false;
          // Strictly inclusive: carPrice >= minSel && carPrice <= maxSel
          if (carPrice >= minSel && carPrice <= maxSel) {
            continue;
          }
          return false;
        } else {
          const carVal = (car as any)[this.mapKeyToCarField(key)];
          if (!sel.map(this.normalize).includes(this.normalize(carVal))) return false;
        }
      }
      return true;
    });
  }

  private mapKeyToCarField(key: string) {
    // map filter keys to Car fields
    switch (key.toLowerCase()) {
      case 'make':
        return 'Make';
      case 'model':
        return 'Model';
      case 'location':
        return 'Location';
      case 'year':
      case 'yearstring':
        return 'YearString';
      case 'price':
        return 'AskingPrice';
      case 'mileage':
        return 'Mileage';
      case 'fuel':
        return 'Fuel';
      case 'transmission':
        return 'Transmission';
      case 'bodytype':
        return 'BodyType';
      case 'colour':
        return 'Colour';
      case 'doors':
        return 'Doors';
      case 'seats':
        return 'Seats';
      case 'status':
        return 'Status';
      default:
        return key;
    }
  }

  recalculateFilterOptions() {
    // For each facet compute options from cars matching all other filters (faceted counts)
    const locationOptions = this.getUniqueOptions(
      this.getFilteredCarsExcluding('location'),
      'Location'
    );
    const makeOptions = this.getUniqueOptions(this.getFilteredCarsExcluding('make'), 'Make');

    // Models: compute from cars matching other filters (excluding model) and narrowed by selected makes if any
    const selectedMakes = this.selectedFilters['make'] || [];
    const selectedMakesNorm = selectedMakes.map(this.normalize);
    let baseForModel = this.getFilteredCarsExcluding('model');
    if (selectedMakesNorm.length > 0) {
      baseForModel = baseForModel.filter((car) =>
        selectedMakesNorm.includes(this.normalize(car.Make))
      );
    }
    const modelCounts: { [key: string]: number } = {};
    baseForModel.forEach((car) => {
      if (car.Model) {
        modelCounts[car.Model] = (modelCounts[car.Model] || 0) + 1;
      }
    });
    const modelOptions = Object.keys(modelCounts).map((val) => ({
      Name: val,
      Count: modelCounts[val],
      Slug: val,
    }));

    this.dynamicFilterOptions = [
      { Parent: 'location', Options: locationOptions },
      { Parent: 'make', Options: makeOptions },
      { Parent: 'model', Options: modelOptions },
      // Year group will be displayed as From/To selects handled separately
      {
        Parent: 'year',
        Options: this.getUniqueOptions(this.getFilteredCarsExcluding('year'), 'YearString'),
      },
      {
        Parent: 'price',
        Options: this.getUniqueOptions(this.getFilteredCarsExcluding('price'), 'AskingPrice'),
      },
      {
        Parent: 'mileage',
        Options: this.getUniqueOptions(this.getFilteredCarsExcluding('mileage'), 'Mileage'),
      },
      {
        Parent: 'fuel',
        Options: this.getUniqueOptions(this.getFilteredCarsExcluding('fuel'), 'Fuel'),
      },
      {
        Parent: 'transmission',
        Options: this.getUniqueOptions(
          this.getFilteredCarsExcluding('transmission'),
          'Transmission'
        ),
      },
      {
        Parent: 'bodytype',
        Options: this.getUniqueOptions(this.getFilteredCarsExcluding('bodytype'), 'BodyType'),
      },
      {
        Parent: 'colour',
        Options: this.getUniqueOptions(this.getFilteredCarsExcluding('colour'), 'Colour'),
      },
      {
        Parent: 'doors',
        Options: this.getUniqueOptions(this.getFilteredCarsExcluding('doors'), 'Doors'),
      },
      {
        Parent: 'seats',
        Options: this.getUniqueOptions(this.getFilteredCarsExcluding('seats'), 'Seats'),
      },
      {
        Parent: 'status',
        Options: this.getUniqueOptions(this.getFilteredCarsExcluding('status'), 'Status'),
      },
      {
        Parent: 'features',
        Options: this.getUniqueFeatureOptions(this.getFilteredCarsExcluding('features')),
      },
    ];

    // Build Year From/To options based on the cars that match other filters
    this.buildYearRangeOptions();
    // Also build Price From/To options so dropdowns are available immediately
    this.buildPriceRangeOptions();

    // Debug logs removed in final cleanup
  }

  private buildYearRangeOptions() {
    const cars = this.getFilteredCarsExcluding('year');
    const counts: { [year: number]: number } = {};
    cars.forEach((car) => {
      const y = parseInt(String(car.YearString));
      if (!isNaN(y)) {
        counts[y] = (counts[y] || 0) + 1;
      }
    });

    // Year counts computed from faceted cars

    const years = Object.keys(counts)
      .map((s) => parseInt(s))
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

    // For each From year, count cars from that year up to the max year
    const maxYear = Math.max(...years);
    this.yearFromOptions = years.map((y) => {
      const count = cars.filter((car) => {
        const carYear = parseInt(String(car.YearString));
        return !isNaN(carYear) && carYear >= y && carYear <= maxYear;
      }).length;
      return {
        Year: y,
        Count: count,
        Label: `${y} (${count})`,
      };
    });

    // yearFromOptions prepared

    // If a From is selected, populate To options with 'Any' and all years >= From
    if (this.selectedYearFrom != null) {
      const minFrom = Number(this.selectedYearFrom || 0);
      const availableYears = years.filter((n) => n >= minFrom);
      // 'Any' = cars from From to max
      const anyCount = cars.filter((car) => {
        const carYear = parseInt(String(car.YearString));
        return !isNaN(carYear) && carYear >= minFrom && carYear <= maxYear;
      }).length;
      this.yearToOptions = [
        { Year: -1, Count: anyCount, Label: 'Any' },
        ...availableYears.map((y) => {
          // Count cars from From to this To year
          const count = cars.filter((car) => {
            const carYear = parseInt(String(car.YearString));
            return !isNaN(carYear) && carYear >= minFrom && carYear <= y;
          }).length;
          return {
            Year: y,
            Count: count,
            Label: `${y} (${count})`,
          };
        }),
      ];
      // If previously selected To is now before From or not in options, reset it
      if (
        this.selectedYearTo == null ||
        this.selectedYearTo < this.selectedYearFrom ||
        !this.yearToOptions.some((o) => o.Year === this.selectedYearTo)
      ) {
        this.selectedYearTo = -1;
      }
    } else {
      // No From selected: populate To with 'Any' and all years (so user can pick a To directly)
      if (years.length > 0) {
        const minYear = Math.min(...years);
        const maxYearAll = Math.max(...years);
        const anyCount = cars.filter((car) => {
          const carYear = parseInt(String(car.YearString));
          return !isNaN(carYear) && carYear >= minYear && carYear <= maxYearAll;
        }).length;
        this.yearToOptions = [
          { Year: -1, Count: anyCount, Label: 'Any' },
          ...years.map((y) => ({
            Year: y,
            Count: cars.filter((car) => {
              const carYear = parseInt(String(car.YearString));
              return !isNaN(carYear) && carYear >= minYear && carYear <= y;
            }).length,
            Label: `${y} (${
              cars.filter((car) => {
                const carYear = parseInt(String(car.YearString));
                return !isNaN(carYear) && carYear >= minYear && carYear <= y;
              }).length
            })`,
          })),
        ];
        // Default To to 'Any' so it's selected and enabled on load
        if (
          this.selectedYearTo == null ||
          !this.yearToOptions.some((o) => o.Year === this.selectedYearTo)
        ) {
          this.selectedYearTo = -1;
        }
      } else {
        this.yearToOptions = [];
        this.selectedYearTo = null;
      }
    }
  }

  private buildPriceRangeOptions() {
    // Use faceted cars (matching other filters) if available; fallback to allCars so buckets are always built
    let cars = this.getFilteredCarsExcluding('price') || [];
    if ((!cars || cars.length === 0) && this.allCars && this.allCars.length > 0) {
      cars = this.allCars.slice();
      if (this.debugEnabled())
        console.debug('[FilterSidebar] price fallback to allCars for bucket build', cars.length);
    }
    const prices: number[] = cars
      .map((c) => {
        const raw = (c as any).AskingPrice;
        if (raw == null) return NaN;
        const s = String(raw).replace(/[^0-9.-]+/g, '');
        const v = parseFloat(s);
        return isNaN(v) ? NaN : v;
      })
      .filter((n) => !isNaN(n) && isFinite(n))
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      this.priceFromOptions = [];
      this.priceToOptions = [];
      this.selectedPriceFrom = null;
      this.selectedPriceTo = null;
      return;
    }

    const STEP = 500;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    // Round min down to nearest 500, max up to nearest 500
    const roundedMin = Math.floor(min / STEP) * STEP;
    const roundedMax = Math.ceil(max / STEP) * STEP;
    const buckets: number[] = [];
    for (let p = roundedMin; p <= roundedMax; p += STEP) {
      buckets.push(p);
    }
    // Ensure the max price is always included if a car exists at that price and it's not already a bucket
    if (prices.length > 0 && buckets[buckets.length - 1] < max) {
      buckets.push(max);
    }

    const fmt = (v: number) => v.toLocaleString();

    // From: just show price label (no count)
    this.priceFromOptions = buckets
      .map((p) => {
        const count = prices.filter((pr) => pr >= p).length;
        return { Price: p, Count: count, Label: `$${fmt(p)} (${count})` };
      })
      .filter((o) => o.Count > 0);

    if (this.selectedPriceFrom != null) {
      const from = Number(this.selectedPriceFrom || 0);
      // Only show To options strictly greater than From, using only valid From options
      const validBuckets = this.priceFromOptions.map((o) => o.Price);
      const available = validBuckets.filter((p) => p > from);
      // Get the true max price from all available prices
      const trueMaxPrice = Math.max(...prices);
      let toOptions = available.map((p) => {
        // Count cars in the range [from, p]
        const count = prices.filter((pr) => pr >= from && pr <= p).length;
        return { Price: p, Count: count, Label: `$${fmt(p)} (${count})` };
      });
      // If From is the highest price, allow To to be the same as From (single car)
      if (from === trueMaxPrice) {
        toOptions = [{ Price: from, Count: 1, Label: `$${fmt(from)} (1)` }];
      } else if (!toOptions.some((o) => o.Price === trueMaxPrice)) {
        // If the max price is not in the list, add it
        const count = prices.filter((pr) => pr >= from && pr <= trueMaxPrice).length;
        toOptions.push({
          Price: trueMaxPrice,
          Count: count,
          Label: `$${fmt(trueMaxPrice)} (${count})`,
        });
      }
      // Remove any existing 'Any' option before unshifting
      toOptions = toOptions.filter((o) => o.Price !== -1);
      // For 'Any', count cars from from to true max price
      const anyCount = prices.filter((pr) => pr >= from && pr <= trueMaxPrice).length;
      toOptions.unshift({ Price: -1, Count: anyCount, Label: 'Any' });
      this.priceToOptions = toOptions;

      if (
        this.selectedPriceTo == null ||
        this.selectedPriceTo < this.selectedPriceFrom ||
        !this.priceToOptions.some((o) => o.Price === this.selectedPriceTo)
      ) {
        this.selectedPriceTo = -1;
      }
    } else {
      // When From is not selected, To should show 'Any' and all buckets after the minimum
      if (this.priceFromOptions.length > 0) {
        const trueMaxPrice = Math.max(...prices);
        const minBucket = this.priceFromOptions[0].Price;
        // To options: all buckets strictly greater than minBucket
        const toBuckets = this.priceFromOptions.map((o) => o.Price).filter((p) => p > minBucket);
        const toOptions = toBuckets.map((p) => {
          const count = prices.filter((pr) => pr >= minBucket && pr <= p).length;
          return { Price: p, Count: count, Label: `$${fmt(p)} (${count})` };
        });
        // 'Any' means min to max
        const anyCount = prices.filter((pr) => pr >= minBucket && pr <= trueMaxPrice).length;
        this.priceToOptions = [{ Price: -1, Count: anyCount, Label: 'Any' }, ...toOptions];
      } else {
        this.priceToOptions = [];
      }
      // Only set selectedPriceTo to -1 if it is null or not in options
      if (
        this.selectedPriceTo == null ||
        !this.priceToOptions.some((o) => o.Price === this.selectedPriceTo)
      ) {
        this.selectedPriceTo = -1;
      }
    }
  }

  getUniqueOptions(cars: any[], key: string) {
    const counts: { [value: string]: number } = {};
    cars.forEach((car) => {
      const value = car[key];
      if (value !== undefined && value !== null && value !== '') {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    return Object.keys(counts).map((val) => ({ Name: val, Count: counts[val], Slug: val }));
  }

  getUniqueFeatureOptions(cars: any[]) {
    const counts: { [value: string]: number } = {};
    cars.forEach((car) => {
      if (car.Features && Array.isArray(car.Features)) {
        car.Features.forEach((f: any) => {
          const name = f.FeatureType?.FriendlyName;
          if (name) {
            counts[name] = (counts[name] || 0) + 1;
          }
        });
      }
    });
    return Object.keys(counts).map((val) => ({ Name: val, Count: counts[val], Slug: val }));
  }

  updateModelOptions() {
    const selectedMakes = this.selectedFilters['make'] || [];
    const selectedMakesNorm = selectedMakes.map(this.normalize);
    if (selectedMakesNorm.length > 0) {
      // Get unique models for any of the selected makes
      this.modelOptions = Array.from(
        new Set(
          this.allCars
            .filter((car) => selectedMakesNorm.includes(this.normalize(car.Make)))
            .map((car) => car.Model)
        )
      );
    } else {
      // Show all models if no make selected
      this.modelOptions = Array.from(new Set(this.allCars.map((car) => car.Model)));
    }
    this.recalculateFilterOptions();
  }

  onYearFromChange(year: number | null) {
    this.selectedYearFrom = year;
    // Reset To if it's before From, but only when To is a real numeric year (not -1 'Any')
    if (
      this.selectedYearTo != null &&
      this.selectedYearTo !== -1 &&
      this.selectedYearFrom != null &&
      this.selectedYearTo < this.selectedYearFrom
    ) {
      this.selectedYearTo = this.selectedYearFrom;
    }
    this.buildYearRangeOptions();
    // If To is not selected, default to 'Any' (-1) and trigger filter
    if (
      this.selectedYearFrom &&
      (this.selectedYearTo == null || this.selectedYearTo < this.selectedYearFrom)
    ) {
      this.selectedYearTo = -1;
    }
    this.applyYearRangeToFilters();
  }

  onYearToChange(year: number | null) {
    this.selectedYearTo = year;
    // Do NOT set selectedYearFrom here; keep UI 'From' as Any if user hasn't selected it.
    try {
      this.applyYearRangeToFilters();
    } catch (err) {
      // Log and swallow to avoid bubbling into zone repeatedly
      console.error('[FilterSidebarError] applyYearRangeToFilters', err, this.selectedFilters);
    }
  }

  onPriceFromChange(price: number | null) {
    this.selectedPriceFrom = price;
    // Reset To if it's before From, only when To is a real numeric bucket (not -1 'Any')
    if (
      this.selectedPriceTo != null &&
      this.selectedPriceTo !== -1 &&
      this.selectedPriceFrom != null &&
      this.selectedPriceTo < this.selectedPriceFrom
    ) {
      this.selectedPriceTo = this.selectedPriceFrom;
    }
    this.buildPriceRangeOptions();
    this.applyPriceRangeToFilters();
  }

  onPriceToChange(price: number | null) {
    this.selectedPriceTo = price;
    // If From is not selected, keep it as Any (min bucket) and set To to selected value
    if (this.selectedPriceFrom == null && price != null) {
      // Do not change selectedPriceFrom, just apply filter with min bucket as From
      try {
        this.applyPriceRangeToFilters();
      } catch (err) {
        console.error('[FilterSidebarError] applyPriceRangeToFilters', err, this.selectedFilters);
      }
    } else {
      try {
        this.applyPriceRangeToFilters();
      } catch (err) {
        console.error('[FilterSidebarError] applyPriceRangeToFilters', err, this.selectedFilters);
      }
    }
  }

  getPriceFromCount(price: number | null): number | '' {
    if (!price || !this.priceFromOptions) return '';
    const o = this.priceFromOptions.find((x) => x.Price === price);
    return o ? o.Count : '';
  }

  getPriceToCount(price: number | null): number | '' {
    if (!price || !this.priceToOptions) return '';
    const o = this.priceToOptions.find((x) => x.Price === price);
    return o ? o.Count : '';
  }

  private applyYearRangeToFilters() {
    // Build array of years between From and To (inclusive) and set selectedFilters['year']
    // If only To is selected, compute an effective From (min available year) for filtering
    let effectiveFrom: number | null = this.selectedYearFrom;
    if (effectiveFrom == null && this.selectedYearTo != null) {
      // determine min available year
      if (this.yearFromOptions && this.yearFromOptions.length > 0) {
        effectiveFrom = Math.min(...this.yearFromOptions.map((o) => o.Year));
      } else {
        const yrs = this.allCars
          .map((c) => parseInt(String((c as any).YearString)))
          .filter((n) => !isNaN(n));
        if (yrs.length > 0) effectiveFrom = Math.min(...yrs);
      }
      if (effectiveFrom == null) {
        delete this.selectedFilters['year'];
        this.recalculateFilterOptions();
        return;
      }
    }

    if (effectiveFrom == null) {
      delete this.selectedFilters['year'];
    } else {
      // Use available year options to build inclusive set (respecting faceted counts)
      const from = Number(effectiveFrom);
      // Interpret -1 as 'Any' (max available year)
      let toRaw = this.selectedYearTo;
      // Determine max available year from current faceted options or fall back to allCars
      let maxAvailableYear: number | null = null;
      if (this.yearFromOptions && this.yearFromOptions.length > 0) {
        maxAvailableYear = Math.max(...this.yearFromOptions.map((o) => o.Year));
      } else {
        const yrs = this.allCars
          .map((c) => parseInt(String((c as any).YearString)))
          .filter((n) => !isNaN(n));
        if (yrs.length > 0) maxAvailableYear = Math.max(...yrs);
      }

      let to: number;
      if (toRaw === -1) {
        to = maxAvailableYear != null ? maxAvailableYear : from;
      } else {
        to = toRaw != null ? Number(toRaw) : from;
      }
      if (isNaN(to)) to = from;
      // Ensure to is at least from (if not, fall back to maxAvailableYear or from)
      if (to < from) {
        to = maxAvailableYear != null ? Math.max(from, maxAvailableYear) : from;
      }

      const available = this.yearFromOptions.map((o) => o.Year).filter((y) => y >= from && y <= to);
      // If available is empty, still include the numeric range as a fallback
      const years =
        available.length > 0
          ? available.map(String)
          : (() => {
              const r: string[] = [];
              for (let y = from; y <= to; y++) r.push(String(y));
              return r;
            })();
      this.selectedFilters['year'] = years;
    }
    this.recalculateFilterOptions();
    // Debug logs removed; state recalculated and filters emitted
    // Emit only non-empty keys
    const filtered: CarFilters = {};
    Object.keys(this.selectedFilters).forEach((key) => {
      if (Array.isArray(this.selectedFilters[key]) && this.selectedFilters[key].length > 0) {
        filtered[key] = this.selectedFilters[key];
      }
    });
    this.emitIfChanged(filtered);
  }

  private applyPriceRangeToFilters() {
    if (this.selectedPriceFrom == null && this.selectedPriceTo != null) {
      // If only To is selected, treat From as the minimum bucket (Any)
      const allBuckets = [
        ...this.priceFromOptions.map((o) => o.Price),
        ...this.priceToOptions.map((o) => o.Price),
      ].filter((p) => typeof p === 'number' && p !== -1);
      const min = Math.min(...allBuckets);
      let to = Number(this.selectedPriceTo);
      if (to === -1) {
        to = Math.max(...allBuckets);
      }
      this.selectedFilters['price'] = [String(min), String(to)];
    } else if (this.selectedPriceFrom == null) {
      delete this.selectedFilters['price'];
    } else {
      const from = Number(this.selectedPriceFrom);
      let to = this.selectedPriceTo != null ? Number(this.selectedPriceTo) : from;
      if (to === -1) {
        // 'Any' selected, use the max available price from all buckets
        const allBuckets = [
          ...this.priceFromOptions.map((o) => o.Price),
          ...this.priceToOptions.map((o) => o.Price),
        ].filter((p) => typeof p === 'number' && p !== -1);
        to = Math.max(...allBuckets);
      }
      this.selectedFilters['price'] = [String(from), String(to)];
    }
    this.recalculateFilterOptions();
    const filtered: CarFilters = {};
    Object.keys(this.selectedFilters).forEach((key) => {
      if (Array.isArray(this.selectedFilters[key]) && this.selectedFilters[key].length > 0) {
        filtered[key] = this.selectedFilters[key];
      }
    });
    this.emitIfChanged(filtered);
  }

  onMakeChange() {
    this.updateModelOptions();
    // Clear model filter when make changes
    this.selectedFilters['model'] = [];
    this.emitFilters();
  }

  emitFilters() {
    // Only emit keys with non-empty arrays
    const filtered: CarFilters = {};
    Object.keys(this.selectedFilters).forEach((key) => {
      if (Array.isArray(this.selectedFilters[key]) && this.selectedFilters[key].length > 0) {
        filtered[key] = this.selectedFilters[key];
      }
    });
    this.emitIfChanged(filtered);
  }

  private emitIfChanged(filtered: CarFilters) {
    // Only emit if filters have truly changed (deep equality)
    if (deepEqual(filtered, this._lastEmittedFiltersObj)) {
      if (this.debugEnabled()) {
        console.log('[FilterDebug] No emit: filters unchanged (deepEqual)');
      }
      return;
    }
    // Debounce emissions to avoid rapid repeated emissions on mobile
    if (this.emitDebounceTimer) {
      clearTimeout(this.emitDebounceTimer);
    }
    if (this.debugEnabled()) {
      // eslint-disable-next-line no-console
      console.log('[FilterDebug] Scheduling emit in', this.EMIT_DEBOUNCE_MS, 'ms ->', filtered);
    }
    this.emitDebounceTimer = setTimeout(() => {
      try {
        if (this.destroyed) return;
        if (this.debugEnabled()) {
          // eslint-disable-next-line no-console
          console.log('[FilterDebug] Emitting filters ->', filtered);
        }
        this._lastEmittedFiltersObj = JSON.parse(JSON.stringify(filtered));
        if (this.filtersChange) {
          console.log('[FilterSidebar] Emitting filtersChange', filtered);
          this.filtersChange.emit(filtered);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          '[FilterSidebarError-UNIQUE-MARKER] emitIfChanged emit failed',
          err,
          err && (err as any).stack
        );
      }
      this.emitDebounceTimer = null;
    }, this.EMIT_DEBOUNCE_MS);
  }

  getSelectedCount(): number {
    return Object.values(this.selectedFilters).reduce((acc, arr) => acc + (arr?.length || 0), 0);
  }

  getSectionSelectedCount(parent: string): number {
    return this.selectedFilters[parent]?.length || 0;
  }

  getDisplayParentName(parent: string): string {
    if (parent === 'make') return 'Make';
    if (parent === 'model') return 'Model';
    return parent.charAt(0).toUpperCase() + parent.slice(1);
  }

  toggleSection(sectionName: string) {
    this.expandedSections[sectionName] = !this.expandedSections[sectionName];
    this.userToggledSections[sectionName] = this.expandedSections[sectionName];
  }

  onFilterChange(parent: string, optionSlug: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;

    const p = String(parent).toLowerCase();
    if (!this.selectedFilters[p]) {
      this.selectedFilters[p] = [];
    }

    if (checkbox.checked) {
      if (!this.selectedFilters[p].includes(optionSlug)) {
        this.selectedFilters[p].push(optionSlug);
      }
    } else {
      const index = this.selectedFilters[p].indexOf(optionSlug);
      if (index > -1) {
        this.selectedFilters[p].splice(index, 1);
      }
    }

    try {
      this.updateExpandedSections();
      this.recalculateFilterOptions();

      // Only emit keys with non-empty arrays
      const filtered: CarFilters = {};
      Object.keys(this.selectedFilters).forEach((key) => {
        if (Array.isArray(this.selectedFilters[key]) && this.selectedFilters[key].length > 0) {
          filtered[key] = this.selectedFilters[key];
        }
      });
      this.emitIfChanged(filtered);
    } catch (err) {
      // Avoid rethrowing and causing zone/loop errors; surface a concise message
      console.error('[FilterSidebarError] onFilterChange', err, {
        parent,
        optionSlug,
        selectedFilters: this.selectedFilters,
      });
    }
  }

  clearAllFilters() {
    this.selectedFilters = {};
    this.filterOptions.forEach((group) => {
      this.selectedFilters[String(group.Parent).toLowerCase()] = [];
    });

    // Reset year and price selects
    this.selectedYearFrom = null;
    this.selectedYearTo = null;
    this.selectedPriceFrom = null;
    this.selectedPriceTo = null;

    // Uncheck checkboxes in DOM (best-effort)
    const checkboxes = document.querySelectorAll(
      '.filter-checkbox'
    ) as NodeListOf<HTMLInputElement>;
    checkboxes.forEach((checkbox) => (checkbox.checked = false));

    this.userToggledSections = {};
    this.emitFilters();
  }

  clearSectionFilters(parent: string) {
    const p = String(parent).toLowerCase();
    delete this.selectedFilters[p];
    // Reset year or price selects if clearing those sections
    if (p === 'year') {
      this.selectedYearFrom = null;
      this.selectedYearTo = null;
    }
    if (p === 'price') {
      this.selectedPriceFrom = null;
      this.selectedPriceTo = null;
    }
    const checkboxes = document.querySelectorAll(
      `.filter-section[data-parent="${parent}"] .filter-checkbox`
    ) as NodeListOf<HTMLInputElement>;
    checkboxes.forEach((checkbox) => (checkbox.checked = false));
    this.emitFilters();
  }
}
