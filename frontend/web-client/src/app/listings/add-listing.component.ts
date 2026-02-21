import { Component, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ObserversModule } from '@angular/cdk/observers';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ListingsApiService, MakeDto, ModelDto, GenerationDto, DerivativeDto, VariantDto, OptionDto, CreateListingDto, VariantFeatureSnapshot, FeatureDto, ListingFeatureInputDto } from './listings-api.service';
import { LocationApiService, CityDto, AreaDto } from '../location/location-api.service';
import { BehaviorSubject, combineLatest, forkJoin } from 'rxjs';
import { map, shareReplay, distinctUntilChanged, switchMap, startWith, finalize, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '../core/notification.service';
import { DestroyRef } from '@angular/core';
import { ProfileApiService } from '../profile/profile-api.service';

@Component({
  selector: 'app-add-listing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ObserversModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatCheckboxModule, MatIconModule, MatTooltipModule, MatDividerModule, MatAutocompleteModule],
  templateUrl: './add-listing.component.html',
  styleUrls: ['./add-listing.component.scss']
})
export class AddListingComponent {
  private fb = inject(FormBuilder);
  private api = inject(ListingsApiService);
  private loc = inject(LocationApiService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  private profileApi = inject(ProfileApiService);

  saving = false;
  years: number[] = [];
  // Simple stepper: 0..3
  currentStep = 0; // 0: Car Information, 1: Additional Info, 2: Upload Photos, 3: Contact Info
  readonly stepTitles = ['Car Information', 'Additional Information', 'Upload Photos', 'Contact Information'];

  private contactPrefillAttempted = false;

  form = this.fb.group({
    description: [''],
    year: [null as number | null, [Validators.required, Validators.min(1900)]],
    mileage: [null as number | null, [Validators.required, Validators.min(0), Validators.max(1_000_000)]],
    price: [null as number | null, [Validators.required, Validators.min(10_000), Validators.max(990_000_000)]],
    bodyColor: [null as string | null, Validators.required],
    makeId: [null as number | null, Validators.required],
    modelId: [null as number | null, Validators.required],
    // Hidden fields, set programmatically based on selected variant
    generationId: [null as number | null],
    derivativeId: [null as number | null],
    // Variant is now optional per requirements
    variantId: [null as number | null],
    transmissionId: [null as number | null, Validators.required],
    fuelTypeId: [null as number | null, Validators.required],
    bodyTypeId: [null as number | null, Validators.required],
    // Location typeahead controls
    citySearch: [''],
    cityId: [null as number | null, Validators.required],
    areaSearch: [''],
    areaId: [null as number | null],
    // Contact info
    contactName: ['', [Validators.required, Validators.maxLength(100)]],
    contactPhone: ['', [Validators.required, Validators.maxLength(30)]],
    contactEmail: ['', [Validators.email, Validators.maxLength(200)]],
    // Engine CC (optional, shown under Body Type)
    engineSizeCC: [null as number | null, [Validators.required, Validators.min(100), Validators.max(90_000)]]
  });

  // State subjects (mirroring web-admin style)
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly generations$ = new BehaviorSubject<GenerationDto[]>([]);
  readonly derivatives$ = new BehaviorSubject<DerivativeDto[]>([]);
  readonly variants$ = new BehaviorSubject<VariantDto[]>([]);
  readonly transmissions$ = new BehaviorSubject<OptionDto[]>([]);
  readonly fuelTypes$ = new BehaviorSubject<OptionDto[]>([]);
  readonly bodyTypes$ = new BehaviorSubject<OptionDto[]>([]);
  readonly features$ = new BehaviorSubject<FeatureDto[]>([]);
  readonly variantFeatures$ = new BehaviorSubject<VariantFeatureSnapshot[]>([]);
  readonly cities$ = new BehaviorSubject<CityDto[]>([]);
  readonly areas$ = new BehaviorSubject<AreaDto[]>([]);
  cityLoading = false; cityError: string | null = null;
  areaLoading = false; areaError: string | null = null;

  // Backing arrays for existing template usage
  makes: MakeDto[] = [];
  models: ModelDto[] = [];
  generations: GenerationDto[] = [];
  derivatives: DerivativeDto[] = [];
  variants: VariantDto[] = [];
  transmissions: OptionDto[] = [];
  fuelTypes: OptionDto[] = [];
  bodyTypes: OptionDto[] = [];
  variantFeatures: VariantFeatureSnapshot[] = [];
  features: FeatureDto[] = [];
  cities: CityDto[] = [];
  areas: AreaDto[] = [];
  selectedFeatureIds = new Set<number>();
  selectedFiles: File[] = [];
  previews: string[] = [];
  dragging = false;
  skipVariant = false;
  showMoreFeatures = false;
  featureLimit = 7;
  hasCitySelected = false;
  @ViewChild('mileageInput') mileageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('areaInput') areaInput?: ElementRef<HTMLInputElement>;
  @ViewChild('areaTrigger') areaTrigger?: MatAutocompleteTrigger;
  @ViewChild('modelSelect') modelSelect?: MatSelect;
  @ViewChild('variantSelect') variantSelect?: MatSelect;
  @ViewChild('bodyColorSelect') bodyColorSelect?: MatSelect;
  @ViewChild('yearSelect') yearSelect?: MatSelect;
  @ViewChild('makeSelect') makeSelect?: MatSelect;

  bodyColors: { name: string; hex: string }[] = [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#000000' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Blue', hex: '#1E40AF' },
    { name: 'Red', hex: '#DC2626' },
    { name: 'Green', hex: '#16A34A' },
    { name: 'Brown', hex: '#8B4513' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Gold', hex: '#D4AF37' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Purple', hex: '#7C3AED' },
    { name: 'Maroon', hex: '#800000' },
    { name: 'Navy', hex: '#001F3F' },
    { name: 'Teal', hex: '#008080' },
    { name: 'Burgundy', hex: '#800020' },
    { name: 'Bronze', hex: '#CD7F32' },
    { name: 'Champagne', hex: '#F7E7CE' }
  ];

  constructor() {
    this.updateFeatureLimit();
    // Build years dropdown (descending from current year to 1900)
    const current = new Date().getFullYear();
    for (let y = current; y >= 1900; y--) this.years.push(y);

    // Load static reference data
    // Load static reference data
    this.api.getMakes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(m => { this.makes = m; this.makes$.next(m); });
    this.api.getOptions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(o => {
      this.transmissions = o.transmissions; this.fuelTypes = o.fuelTypes; this.bodyTypes = o.bodyTypes;
      this.transmissions$.next(o.transmissions); this.fuelTypes$.next(o.fuelTypes); this.bodyTypes$.next(o.bodyTypes);
    });
    this.api.getFeatures().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(f => { this.features = f; this.features$.next(f); });

    // City typeahead (dropdown look via suffix icon)
    this.form.get('citySearch')!.valueChanges.pipe(startWith(''), takeUntilDestroyed(this.destroyRef)).subscribe(search => {
      const s = (search || '').toString();
      this.cityLoading = true; this.cityError = null;
      this.loc.searchCities(s).subscribe({
        next: items => { this.cities = items; this.cities$.next(items); this.cityLoading = false; },
        error: () => { this.cityLoading = false; this.cityError = 'Failed to load cities'; }
      });
    });
    // Area typeahead depends on selected city
    combineLatest([
      this.form.get('areaSearch')!.valueChanges.pipe(startWith('')),
      this.form.get('cityId')!.valueChanges.pipe(startWith(this.form.value.cityId))
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([search, cityId]) => {
      const s = (search || '').toString();
      this.hasCitySelected = !!cityId;
      this.areaLoading = true; this.areaError = null;
      this.loc.searchAreas(s, cityId ?? undefined).subscribe({
        next: items => { this.areas = items; this.areas$.next(items); this.areaLoading = false; },
        error: () => { this.areaLoading = false; this.areaError = 'Failed to load areas'; }
      });
    });

    // When Make changes: load models under make, aggregate derivatives/generations for its models, then refresh variants
    this.form.get('makeId')!.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(makeId => {
      this.models = []; this.generations = []; this.derivatives = []; this.variants = []; this.variantFeatures = [];
      this.form.patchValue({ modelId: null, generationId: null, derivativeId: null, variantId: null }, { emitEvent: false });
      if (!makeId) { this.models$.next([]); this.generations$.next([]); this.derivatives$.next([]); this.refreshVariants(); return; }
      this.api.getModels(makeId!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(models => {
        this.models = models; this.models$.next(models);
        // Auto-focus and open Model dropdown when Make is selected
        setTimeout(() => { this.modelSelect?.focus(); this.modelSelect?.open(); }, 0);
        if (models.length === 0) { this.refreshVariants(); return; }
        const genReqs = models.map(m => this.api.getGenerations(m.id));
        const derReqs = models.map(m => this.api.getDerivatives(m.id));
        forkJoin({ gens: forkJoin(genReqs).pipe(map(groups => groups.flat())), ders: forkJoin(derReqs).pipe(map(groups => groups.flat())) })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ gens, ders }) => { this.generations = gens; this.derivatives = ders; this.generations$.next(gens); this.derivatives$.next(ders); this.refreshVariants(); });
      });
    });

    // When Model changes: refresh variants (derivatives/generations already loaded for make)
    this.form.get('modelId')!.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.variants = []; this.form.patchValue({ variantId: null }, { emitEvent: false });
      this.refreshVariants();
      // After variants refresh, open Variant if available, else Body Color
      this.variants$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(vars => {
        const count = (vars?.length ?? this.variants.length);
        setTimeout(() => {
          if (count > 0) { this.variantSelect?.focus(); this.variantSelect?.open(); }
          else { this.bodyColorSelect?.focus(); this.bodyColorSelect?.open(); }
        }, 0);
      });
    });

    // When Year changes: recompute variants
    this.form.get('year')!.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.variants = []; this.form.patchValue({ variantId: null }, { emitEvent: false });
      this.refreshVariants();
      // After year selection, open Make dropdown
      setTimeout(() => { this.makeSelect?.focus(); this.makeSelect?.open(); }, 0);
    });

    // On Variant selection: derive generation/derivative and load features
    this.form.get('variantId')!.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(variantId => {
      this.variantFeatures = []; this.variantFeatures$.next([]);
      this.selectedFeatureIds.clear();
      const variant = this.variants.find(v => v.id === variantId!);
      const der = this.derivatives.find(d => d.id === variant?.derivativeId);
      const genId = der?.generationId ?? null;
      this.form.patchValue({ derivativeId: der?.id ?? null, generationId: genId }, { emitEvent: false });
      if (variantId) this.api.getVariantFeatures(variantId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(vf => {
        this.variantFeatures = vf; this.variantFeatures$.next(vf);
        // Preselect variant features
        vf.forEach(v => this.selectedFeatureIds.add(v.featureId));
      });
      // Ensure Body Color is set when a Variant is chosen; if not set, open Body Color
      const hasBodyColor = !!this.form.get('bodyColor')?.value;
      this.ensureDefaultBodyColor();
      if (!hasBodyColor) setTimeout(() => { this.bodyColorSelect?.focus(); this.bodyColorSelect?.open(); }, 0);
      // Populate additional information from derivative when available
      const byName = (arr: { id:number; name?:string }[], name?: string | null) => {
        if (!name) return null; const target = (name || '').toLowerCase();
        return arr.find(a => (a.name || '').toLowerCase() === target)?.id ?? null;
      };
      if (der) {
        const trId = byName(this.transmissions, der.transmission);
        const fuId = byName(this.fuelTypes, der.fuelType);
        const btId = byName(this.bodyTypes, der.bodyType);
        this.form.patchValue({ transmissionId: trId, fuelTypeId: fuId, bodyTypeId: btId, engineSizeCC: der.engineCC ?? null }, { emitEvent: false });
      }
    });

    // Derived variants stream (cached)
    combineLatest([
      this.generations$.pipe(startWith([] as GenerationDto[])),
      this.derivatives$.pipe(startWith([] as DerivativeDto[])),
      this.models$.pipe(startWith([] as ModelDto[])),
      this.form.get('modelId')!.valueChanges.pipe(startWith(this.form.value.modelId)),
      this.form.get('year')!.valueChanges.pipe(startWith(this.form.value.year)),
      this.form.get('makeId')!.valueChanges.pipe(startWith(this.form.value.makeId))
    ]).pipe(
      map(([generations, derivatives, models, modelId, year, makeId]) => {
        if (!makeId || !year) return [] as VariantDto[];
        const allowedModelIds = new Set(models.map(m => m.id));
        const gensForYear = generations.filter(g => {
          const start = g.startYear ?? 0; const end = g.endYear ?? 9999;
          const inYear = (year as number) >= start && (year as number) <= end;
          const inMake = allowedModelIds.has(g.modelId);
          const matchesModel = !modelId || g.modelId === modelId;
          return inYear && inMake && matchesModel;
        });
        if (gensForYear.length === 0) return [];
        // Keep imperative fetch for variants by generation; result applied in refreshVariants
        return [] as VariantDto[];
      }),
      shareReplay(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  // Step validation rules
  isStepValid(index: number): boolean {
    switch (index) {
      case 0:
        return !!this.form.get('year')?.valid
          && !!this.form.get('makeId')?.valid
          && !!this.form.get('modelId')?.valid
          && !!this.form.get('mileage')?.valid
          && !!this.form.get('price')?.valid
          && !!this.form.get('cityId')?.value; // city is mandatory
      case 1:
        return !!this.form.get('bodyTypeId')?.valid
          && !!this.form.get('transmissionId')?.value
          && !!this.form.get('fuelTypeId')?.value
          && !!this.form.get('engineSizeCC')?.value; // now mandatory
      case 2:
        return this.selectedFiles.length > 0; // require at least one photo to proceed
      case 3:
        // Require Name and Phone explicitly
        const name = (this.form.get('contactName')?.value || '').toString().trim();
        const phone = (this.form.get('contactPhone')?.value || '').toString().trim();
        return name.length > 0 && phone.length > 0;
      default:
        return false;
    }
  }

  // Visual status helpers
  isStepCompleted(index: number): boolean {
    if (index < this.currentStep) return this.isStepValid(index);
    return false;
  }

  goNext() {
    if (!this.isStepValid(this.currentStep)) return;
    if (this.currentStep < 3) this.currentStep++;
    if (this.currentStep === 3) this.prefillContactInfoFromProfile();
  }

  goTo(index: number) {
    // Allow navigating back and to unlocked steps only
    if (index < 0 || index > 3) return;
    if (!this.canNavigate(index)) return;
    this.currentStep = index;
    if (this.currentStep === 3) this.prefillContactInfoFromProfile();
  }

  private prefillContactInfoFromProfile(): void {
    if (this.contactPrefillAttempted) return;
    this.contactPrefillAttempted = true;

    this.profileApi.getMe().pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: me => {
        const currentName = (this.form.get('contactName')?.value ?? '').toString().trim();
        const currentPhone = (this.form.get('contactPhone')?.value ?? '').toString().trim();
        const currentEmail = (this.form.get('contactEmail')?.value ?? '').toString().trim();

        this.form.patchValue({
          contactName: currentName ? currentName : (me.displayName ?? ''),
          contactPhone: currentPhone ? currentPhone : (me.phoneNumber ?? ''),
          contactEmail: currentEmail ? currentEmail : (me.email ?? '')
        }, { emitEvent: false });
      },
      error: () => {
        // No profile yet (e.g. 404) - that's fine; leave contact fields empty.
      }
    });
  }

  canNavigate(index: number): boolean {
    if (index <= this.currentStep) return true; // back or current
    // forward navigation only if previous step completed
    return this.isStepValid(index - 1);
  }

  // Simplified UI condition getters to avoid complex template expressions
  get showVariantSelector(): boolean {
    const hasModel = !!this.form.value.modelId;
    const count = this.variants.length;
    return hasModel && count > 0;
  }
  get showAdditionalInfo(): boolean {
    const hasModel = !!this.form.value.modelId;
    const hasVariant = !!this.form.value.variantId;
    const count = this.variants.length;
    return this.skipVariant || hasVariant || (hasModel && count === 0);
  }

  findById(list: { id: number }[], id: number | null | undefined) {
    if (id == null) return undefined as any;
    return list.find(x => x.id === id) as any;
  }

  onSkip() {
    this.skipVariant = true;
    // Clear any selected variant and hide its tick
    this.form.patchValue({ variantId: null }, { emitEvent: true });
    // If body color not selected, select and open; otherwise keep focus on Variant dropdown
    const hasBodyColor = !!this.form.get('bodyColor')?.value;
    this.ensureDefaultBodyColor();
    if (!hasBodyColor) setTimeout(() => { this.bodyColorSelect?.focus(); this.bodyColorSelect?.open(); }, 0);
    // Clear Additional Information controls
    this.form.patchValue({ transmissionId: null, fuelTypeId: null, bodyTypeId: null, engineSizeCC: null }, { emitEvent: false });
    this.selectedFeatureIds.clear();
    this.variantFeatures = []; this.variantFeatures$.next([]);
  }

  submit() {
    // Final step submission gated by step validity
    if (this.saving) return;
    if (!this.isStepValid(3)) return;
    // Also ensure overall form validity (Angular validators)
    if (this.form.invalid) return;
    // Enforce variant selection rule only when variants exist for the selected model.
    // If there are no variants, allow submit without forcing Skip.
    if (this.showVariantSelector && !this.form.value.variantId && !this.skipVariant) {
      this.notify.error('Please select a Variant or choose Skip.');
      return;
    }
    this.saving = true;
    this.form.disable({ emitEvent: false });
    const raw = this.form.value;
    const makeName = this.makes.find(x => x.id === raw.makeId!)?.name;
    const modelName = this.models.find(x => x.id === raw.modelId!)?.name;
    const year = raw.year!;
    const computedTitle = `${makeName ?? ''} ${modelName ?? ''} ${year}`.trim();
    const derivative = this.derivatives.find(x => x.id === raw.derivativeId!);
    const featureInputs: ListingFeatureInputDto[] = Array.from(this.selectedFeatureIds).map(id => {
      const f = this.features.find(x => x.id === id);
      return {
        featureCode: f?.code ?? String(id),
        featureName: f?.name ?? '',
        featureDescription: f?.description,
        featureCategoryName: f?.featureCategory ?? '',
        featureCategoryCode: f?.featureCategoryCode ?? ''
      };
    });
    const dto: CreateListingDto = {
      title: computedTitle,
      description: raw.description ?? undefined,
      year: raw.year!,
      mileage: raw.mileage!,
      price: raw.price!,
      bodyColor: raw.bodyColor ?? undefined,
      makeCode: this.makes.find(x => x.id === raw.makeId!)?.code!,
      modelCode: this.models.find(x => x.id === raw.modelId!)?.code!,
      generationCode: this.generations.find(x => x.id === raw.generationId!)?.code!,
      derivativeCode: this.derivatives.find(x => x.id === raw.derivativeId!)?.code!,
      variantCode: (raw.variantId ? this.variants.find(x => x.id === raw.variantId!)?.code : undefined),
      transmissionTypeCode: (raw.transmissionId ? this.transmissions.find(x => x.id === raw.transmissionId)?.code : undefined),
      fuelTypeCode: (raw.fuelTypeId ? this.fuelTypes.find(x => x.id === raw.fuelTypeId)?.code : undefined),
      bodyTypeCode: this.bodyTypes.find(x => x.id === raw.bodyTypeId!)?.code!,
      // Optional labels (snapshots)
      makeName,
      modelName,
      generationName: this.generations.find(x => x.id === raw.generationId!)?.name,
      derivativeName: this.derivatives.find(x => x.id === raw.derivativeId!)?.name,
      variantName: (raw.variantId ? this.variants.find(x => x.id === raw.variantId!)?.name : undefined),
      bodyTypeName: this.bodyTypes.find(x => x.id === raw.bodyTypeId!)?.name ?? this.derivatives.find(x => x.id === raw.derivativeId!)?.bodyType,
      transmissionTypeName: (raw.transmissionId ? this.transmissions.find(x => x.id === raw.transmissionId)?.name : undefined)
        ?? this.derivatives.find(x => x.id === raw.derivativeId!)?.transmission,
      fuelTypeName: (raw.fuelTypeId ? this.fuelTypes.find(x => x.id === raw.fuelTypeId)?.name : undefined)
        ?? this.derivatives.find(x => x.id === raw.derivativeId!)?.fuelType,
      // Location snapshots
      cityCode: (raw.cityId ? this.cities.find(c => c.id === raw.cityId!)?.code : undefined),
      cityName: (raw.cityId ? this.cities.find(c => c.id === raw.cityId!)?.name : undefined),
      areaCode: (raw.areaId ? this.areas.find(a => a.id === raw.areaId!)?.code : undefined),
      areaName: (raw.areaId ? this.areas.find(a => a.id === raw.areaId!)?.name : undefined),
      provinceName: (raw.cityId ? this.cities.find(c => c.id === raw.cityId!)?.provinceName : undefined),
      // ProvinceCode will be derived server-side if omitted; could fetch via API when needed
      seats: derivative?.seats,
      doors: derivative?.doors,
      engineSizeCC: raw.engineSizeCC ?? derivative?.engineCC ?? undefined,
      engineSizeL: derivative?.engineL ?? undefined,
      // Contact info
      contactName: raw.contactName || undefined,
      contactPhone: raw.contactPhone || undefined,
      contactEmail: raw.contactEmail || undefined,
      features: featureInputs
    };
    const city = (raw.cityId ? this.cities.find(c => c.id === raw.cityId!) : undefined);
    const ensureProvince$ = (!dto.provinceCode && city?.provinceId)
      ? this.loc.getProvince(city!.provinceId).pipe(map(p => { dto.provinceCode = p.code; return dto; }))
      : new BehaviorSubject(dto);

    ensureProvince$.pipe(switchMap(finalDto => this.api.createListing(finalDto)))
      .subscribe({
        next: (created) => {
          const upload$ = this.selectedFiles.length ? this.api.uploadListingImages(created.id, this.selectedFiles) : undefined;
          if (upload$) {
            upload$.pipe(finalize(() => { this.saving = false; this.form.enable({ emitEvent: false }); }))
              .subscribe({
                next: () => this.afterCreated(),
                error: (e) => { this.saving = false; this.form.enable({ emitEvent: false }); this.notify.error(typeof e === 'string' ? e : 'Failed to upload images'); }
              });
          } else {
            this.saving = false; this.form.enable({ emitEvent: false }); this.afterCreated();
          }
        },
        error: (e) => { this.saving = false; this.form.enable({ emitEvent: false }); this.notify.error(typeof e === 'string' ? e : 'Failed to create listing'); }
      });
  }

  // Additional Information: toggle feature selection
  toggleFeature(featureId: number, checked: boolean) {
    if (checked) this.selectedFeatureIds.add(featureId);
    else this.selectedFeatureIds.delete(featureId);
  }

  private refreshVariants() {
    const makeId = this.form.value.makeId;
    const modelId = this.form.value.modelId;
    const year = this.form.value.year;
    if (!makeId || !year) return; // Need at least make + year
    const allowedModelIds = new Set(this.models.map(m => m.id));
    // Filter generations by year range and by model filter (if a model is chosen)
    const gensForYear = this.generations.filter(g => {
      const start = g.startYear ?? 0;
      const end = g.endYear ?? 9999;
      const inYear = year >= start && year <= end;
      const inMake = allowedModelIds.has(g.modelId);
      const matchesModel = !modelId || g.modelId === modelId;
      return inYear && inMake && matchesModel;
    });
    if (gensForYear.length === 0) { this.variants = []; return; }
    forkJoin(gensForYear.map(g => this.api.getVariantsByGeneration(g.id)))
      .pipe(map(groups => groups.flat()))
      .subscribe(vars => {
        const allowedDerivatives = this.derivatives.filter(d => allowedModelIds.has(d.modelId) && (!modelId || d.modelId === modelId));
        const allowedDerIds = new Set(allowedDerivatives.map(d => d.id));
        const filtered = vars.filter(v => allowedDerIds.has(v.derivativeId));
        this.variants = filtered; this.variants$.next(filtered);
      });
  }

  onFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    const list = files ? Array.from(files) : [];
    // Validate: max 10 files total, type and size (<=5MB). Append new files.
    const maxCount = 10;
    const maxSize = 5 * 1024 * 1024;
    const allowed = new Set(['image/jpeg','image/png','image/webp','image/gif']);
    for (const f of list) {
      if (this.selectedFiles.length >= maxCount) break;
      if (!allowed.has(f.type)) continue;
      if (f.size > maxSize) continue;
      this.selectedFiles.push(f);
      this.previews.push(URL.createObjectURL(f));
    }
    // Default first image as cover
    this.coverIndex = 0;
  }

  onCitySelectedById(id: number) {
    const city = this.cities.find(c => c.id === id);
    // Set both id and visible text, reset area, and emit for area reload
    this.form.patchValue({ cityId: id, citySearch: city?.name ?? '', areaId: null, areaSearch: '' }, { emitEvent: true });
    this.hasCitySelected = !!id;
    // Focus Area input and open its dropdown after city selection
    setTimeout(() => {
      this.areaInput?.nativeElement?.focus();
      this.areaTrigger?.openPanel();
    }, 0);
  }

  onAreaSelectedById(id: number) {
    const area = this.areas.find(a => a.id === id);
    this.form.patchValue({ areaId: id, areaSearch: area?.name ?? '' }, { emitEvent: false });
    // After area selection, open Model Year dropdown
    setTimeout(() => { this.yearSelect?.focus(); this.yearSelect?.open(); }, 0);
  }

  private afterCreated() {
    const ref = this.notify.success('Listing created', 'View listings');
    ref.onAction().subscribe(() => {
      const el = document.getElementById('listings-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // Reset selected files and previews
    this.selectedFiles = [];
    this.previews.forEach(url => URL.revokeObjectURL(url));
    this.previews = [];
    this.coverIndex = 0;
  }

  // Drag & drop helpers (UI only)
  onDragOver(event: DragEvent) { event.preventDefault(); this.dragging = true; }
  onDragLeave(event: DragEvent) { event.preventDefault(); this.dragging = false; }
  onDrop(event: DragEvent) {
    event.preventDefault(); this.dragging = false;
    const files = event.dataTransfer?.files; if (!files || files.length === 0) return;
    const inputEvent = { target: { files } } as any as Event;
    this.onFilesSelected(inputEvent);
  }

  // Image management: delete and set cover
  coverIndex = 0;
  setCover(i: number) {
    if (i < 0 || i >= this.selectedFiles.length) return;
    if (i === 0) { this.coverIndex = 0; return; }
    // Move chosen image to index 0 to keep API ordering (first is cover)
    const file = this.selectedFiles.splice(i, 1)[0];
    const prev = this.previews.splice(i, 1)[0];
    this.selectedFiles.unshift(file);
    this.previews.unshift(prev);
    this.coverIndex = 0;
  }
  onBodyColorSelected() {
    // Move focus to the next logical control (Mileage)
    setTimeout(() => this.mileageInput?.nativeElement?.focus(), 0);
  }
  removeImage(i: number) {
    if (i < 0 || i >= this.selectedFiles.length) return;
    const [f] = this.selectedFiles.splice(i, 1);
    const [url] = this.previews.splice(i, 1);
    try { if (url) URL.revokeObjectURL(url); } catch {}
    if (this.coverIndex === i) this.coverIndex = 0;
    if (this.coverIndex > i) this.coverIndex--;
  }

  // Open dropdowns and refresh regardless of current typed text
  openCityDropdown(trigger: MatAutocompleteTrigger) {
    this.form.get('citySearch')!.setValue('');
    // valueChanges subscription will fetch with empty search
    setTimeout(() => trigger.openPanel(), 0);
  }

  openAreaDropdown(trigger: MatAutocompleteTrigger) {
    this.form.get('areaSearch')!.setValue('');
    setTimeout(() => trigger.openPanel(), 0);
  }

  /** Ensure a default Body Color is selected if none is chosen yet */
  private ensureDefaultBodyColor() {
    const current = (this.form.get('bodyColor')?.value || '').toString();
    if (current && current.trim().length > 0) return;
    const preferred = this.bodyColors.find(c => c.name.toLowerCase() === 'silver')
      ?? this.bodyColors[0];
    if (preferred) this.form.patchValue({ bodyColor: preferred.name }, { emitEvent: false });
  }

  /** Features visibility: responsive limits (7/14/21), with selected first */
  get visibleFeatures(): FeatureDto[] {
    const all = [...this.features];
    all.sort((a, b) => {
      const aSel = this.selectedFeatureIds.has(a.id) ? 1 : 0;
      const bSel = this.selectedFeatureIds.has(b.id) ? 1 : 0;
      return bSel - aSel;
    });
    if (this.showMoreFeatures) return all;
    return all.slice(0, this.featureLimit);
  }

  toggleShowMoreFeatures() { this.showMoreFeatures = !this.showMoreFeatures; }

  // Responsive feature limits: 7 small (<768), 14 medium (>=768 and <1280), 21 large (>=1280)
  @HostListener('window:resize') onResize() { this.updateFeatureLimit(); }
  private updateFeatureLimit() {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
    if (w >= 1280) this.featureLimit = 21;
    else if (w >= 768) this.featureLimit = 14;
    else this.featureLimit = 7;
  }

  // Focus handlers to populate options even if input has a value
  onCityFocus(trigger: MatAutocompleteTrigger) {
    this.cityLoading = true; this.cityError = null;
    this.loc.searchCities('').subscribe({
      next: items => { this.cities = items; this.cities$.next(items); this.cityLoading = false; trigger.openPanel(); },
      error: () => { this.cityLoading = false; this.cityError = 'Failed to load cities'; trigger.openPanel(); }
    });
  }
  onAreaFocus(trigger: MatAutocompleteTrigger) {
    this.areaLoading = true; this.areaError = null;
    const cityId = this.form.value.cityId ?? undefined;
    this.loc.searchAreas('', cityId).subscribe({
      next: items => { this.areas = items; this.areas$.next(items); this.areaLoading = false; trigger.openPanel(); },
      error: () => { this.areaLoading = false; this.areaError = 'Failed to load areas'; trigger.openPanel(); }
    });
  }
}
