import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ObserversModule } from '@angular/cdk/observers';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ListingsApiService, MakeDto, ModelDto, GenerationDto, DerivativeDto, VariantDto, OptionDto, CreateListingDto, VariantFeatureSnapshot, FeatureDto } from './listings-api.service';
import { BehaviorSubject, combineLatest, forkJoin } from 'rxjs';
import { map, shareReplay, distinctUntilChanged, switchMap, startWith, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '../core/notification.service';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'app-add-listing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ObserversModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatCheckboxModule],
  templateUrl: './add-listing.component.html',
  styleUrls: ['./add-listing.component.scss']
})
export class AddListingComponent {
  private fb = inject(FormBuilder);
  private api = inject(ListingsApiService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  saving = false;
  years: number[] = [];

  form = this.fb.group({
    description: [''],
    year: [null as number | null, [Validators.required, Validators.min(1900)]],
    mileage: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]],
    makeId: [null as number | null, Validators.required],
    modelId: [null as number | null, Validators.required],
    // Hidden fields, set programmatically based on selected variant
    generationId: [null as number | null],
    derivativeId: [null as number | null],
    variantId: [null as number | null, Validators.required],
    transmissionId: [null as number | null],
    fuelTypeId: [null as number | null],
    bodyTypeId: [null as number | null, Validators.required]
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
  selectedFeatureIds = new Set<number>();
  selectedFiles: File[] = [];
  previews: string[] = [];

  constructor() {
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

    // When Make changes: load models under make, aggregate derivatives/generations for its models, then refresh variants
    this.form.get('makeId')!.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(makeId => {
      this.models = []; this.generations = []; this.derivatives = []; this.variants = []; this.variantFeatures = [];
      this.form.patchValue({ modelId: null, generationId: null, derivativeId: null, variantId: null }, { emitEvent: false });
      if (!makeId) { this.models$.next([]); this.generations$.next([]); this.derivatives$.next([]); this.refreshVariants(); return; }
      const makeCode = this.makes.find(m => m.id === makeId)?.code;
      this.api.getModels(makeCode).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(models => {
        this.models = models; this.models$.next(models);
        if (models.length === 0) { this.refreshVariants(); return; }
        const genReqs = models.map(m => this.api.getGenerations(m.code));
        const derReqs = models.map(m => this.api.getDerivatives(m.code));
        forkJoin({ gens: forkJoin(genReqs).pipe(map(groups => groups.flat())), ders: forkJoin(derReqs).pipe(map(groups => groups.flat())) })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ gens, ders }) => { this.generations = gens; this.derivatives = ders; this.generations$.next(gens); this.derivatives$.next(ders); this.refreshVariants(); });
      });
    });

    // When Model changes: refresh variants (derivatives/generations already loaded for make)
    this.form.get('modelId')!.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.variants = []; this.form.patchValue({ variantId: null }, { emitEvent: false });
      this.refreshVariants();
    });

    // When Year changes: recompute variants
    this.form.get('year')!.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.variants = []; this.form.patchValue({ variantId: null }, { emitEvent: false });
      this.refreshVariants();
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

  findById(list: { id: number }[], id: number | null | undefined) {
    if (id == null) return undefined as any;
    return list.find(x => x.id === id) as any;
  }

  submit() {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.form.disable({ emitEvent: false });
    const raw = this.form.value;
    const makeName = this.makes.find(x => x.id === raw.makeId!)?.name;
    const modelName = this.models.find(x => x.id === raw.modelId!)?.name;
    const year = raw.year!;
    const computedTitle = `${makeName ?? ''} ${modelName ?? ''} ${year}`.trim();
    const dto: CreateListingDto = {
      title: computedTitle,
      description: raw.description ?? undefined,
      year: raw.year!,
      mileage: raw.mileage!,
      price: raw.price!,
      makeCode: this.makes.find(x => x.id === raw.makeId!)?.code!,
      modelCode: this.models.find(x => x.id === raw.modelId!)?.code!,
      generationCode: this.generations.find(x => x.id === raw.generationId!)?.code!,
      derivativeCode: this.derivatives.find(x => x.id === raw.derivativeId!)?.code!,
      variantCode: this.variants.find(x => x.id === raw.variantId!)?.code!,
      transmissionTypeCode: (raw.transmissionId ? this.transmissions.find(x => x.id === raw.transmissionId)?.code : undefined),
      fuelTypeCode: (raw.fuelTypeId ? this.fuelTypes.find(x => x.id === raw.fuelTypeId)?.code : undefined),
      bodyTypeCode: this.bodyTypes.find(x => x.id === raw.bodyTypeId!)?.code!,
      // Optional labels (snapshots)
      makeName,
      modelName,
      generationName: this.generations.find(x => x.id === raw.generationId!)?.name,
      derivativeName: this.derivatives.find(x => x.id === raw.derivativeId!)?.name,
      variantName: this.variants.find(x => x.id === raw.variantId!)?.name,
      bodyTypeName: this.bodyTypes.find(x => x.id === raw.bodyTypeId!)?.name ?? this.derivatives.find(x => x.id === raw.derivativeId!)?.bodyType,
      transmissionTypeName: (raw.transmissionId ? this.transmissions.find(x => x.id === raw.transmissionId)?.name : undefined)
        ?? this.derivatives.find(x => x.id === raw.derivativeId!)?.transmission,
      fuelTypeName: (raw.fuelTypeId ? this.fuelTypes.find(x => x.id === raw.fuelTypeId)?.name : undefined)
        ?? this.derivatives.find(x => x.id === raw.derivativeId!)?.fuelType,
      featureIds: Array.from(this.selectedFeatureIds)
    };
    this.api.createListing(dto)
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
    forkJoin(gensForYear.map(g => this.api.getVariantsByGeneration(g.code)))
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
    // Validate: max 10 files, type and size (<=5MB)
    const maxCount = 10;
    const maxSize = 5 * 1024 * 1024;
    const allowed = new Set(['image/jpeg','image/png','image/webp','image/gif']);
    const filtered: File[] = [];
    for (const f of list) {
      if (filtered.length >= maxCount) break;
      if (!allowed.has(f.type)) continue;
      if (f.size > maxSize) continue;
      filtered.push(f);
    }
    this.selectedFiles = filtered;
    // Build previews
    this.previews.forEach(url => URL.revokeObjectURL(url));
    this.previews = this.selectedFiles.map(f => URL.createObjectURL(f));
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
  }
}
