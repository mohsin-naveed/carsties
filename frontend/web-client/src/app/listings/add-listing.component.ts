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
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from '../core/notification.service';
import { finalize } from 'rxjs/operators';

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

  constructor() {
    // Build years dropdown (descending from current year to 1900)
    const current = new Date().getFullYear();
    for (let y = current; y >= 1900; y--) this.years.push(y);

    // Load static reference data
    this.api.getMakes().subscribe(m => this.makes = m);
    this.api.getOptions().subscribe(o => { this.transmissions = o.transmissions; this.fuelTypes = o.fuelTypes; this.bodyTypes = o.bodyTypes; });
    this.api.getFeatures().subscribe(f => this.features = f);

    // When Make changes: load models under make, aggregate derivatives/generations for its models, then refresh variants
    this.form.get('makeId')!.valueChanges.subscribe(makeId => {
      this.models = []; this.generations = []; this.derivatives = []; this.variants = []; this.variantFeatures = [];
      this.form.patchValue({ modelId: null, generationId: null, derivativeId: null, variantId: null }, { emitEvent: false });
      if (!makeId) return;
      this.api.getModels(makeId).subscribe(models => {
        this.models = models;
        if (models.length === 0) { this.refreshVariants(); return; }
        const genReqs = models.map(m => this.api.getGenerations(m.id));
        const derReqs = models.map(m => this.api.getDerivatives(m.id));
        forkJoin({ gens: forkJoin(genReqs).pipe(map(groups => groups.flat())), ders: forkJoin(derReqs).pipe(map(groups => groups.flat())) })
          .subscribe(({ gens, ders }) => { this.generations = gens; this.derivatives = ders; this.refreshVariants(); });
      });
    });

    // When Model changes: refresh variants (derivatives/generations already loaded for make)
    this.form.get('modelId')!.valueChanges.subscribe(() => {
      this.variants = []; this.form.patchValue({ variantId: null }, { emitEvent: false });
      this.refreshVariants();
    });

    // When Year changes: recompute variants
    this.form.get('year')!.valueChanges.subscribe(() => {
      this.variants = []; this.form.patchValue({ variantId: null }, { emitEvent: false });
      this.refreshVariants();
    });

    // On Variant selection: derive generation/derivative and load features
    this.form.get('variantId')!.valueChanges.subscribe(variantId => {
      this.variantFeatures = [];
      this.selectedFeatureIds.clear();
      const variant = this.variants.find(v => v.id === variantId!);
      const der = this.derivatives.find(d => d.id === variant?.derivativeId);
      const genId = der?.generationId ?? null;
      this.form.patchValue({ derivativeId: der?.id ?? null, generationId: genId }, { emitEvent: false });
      if (variantId) this.api.getVariantFeatures(variantId).subscribe(vf => {
        this.variantFeatures = vf;
        // Preselect variant features
        vf.forEach(v => this.selectedFeatureIds.add(v.featureId));
      });
    });
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
      title: computedTitle, description: raw.description ?? undefined, year: raw.year!, mileage: raw.mileage!, price: raw.price!,
      makeId: raw.makeId!, modelId: raw.modelId!, generationId: raw.generationId!, derivativeId: raw.derivativeId!, variantId: raw.variantId!,
      transmissionId: raw.transmissionId ?? undefined, fuelTypeId: raw.fuelTypeId ?? undefined, bodyTypeId: raw.bodyTypeId!,
      // snapshots
      makeName,
      modelName,
      generationName: this.generations.find(x => x.id === raw.generationId!)?.name,
      derivativeName: this.derivatives.find(x => x.id === raw.derivativeId!)?.name,
      variantName: this.variants.find(x => x.id === raw.variantId!)?.name,
      bodyTypeName: this.derivatives.find(x => x.id === raw.derivativeId!)?.bodyType ?? this.bodyTypes.find(x => x.id === raw.bodyTypeId!)?.name,
      transmissionName: this.derivatives.find(x => x.id === raw.derivativeId!)?.transmission ?? this.transmissions.find(x => x.id === raw.transmissionId!)?.name,
      fuelTypeName: this.derivatives.find(x => x.id === raw.derivativeId!)?.fuelType ?? this.fuelTypes.find(x => x.id === raw.fuelTypeId!)?.name,
      seatsSnapshot: this.derivatives.find(x => x.id === raw.derivativeId!)?.seats,
      doorsSnapshot: this.derivatives.find(x => x.id === raw.derivativeId!)?.doors,
      engineSnapshot: this.derivatives.find(x => x.id === raw.derivativeId!)?.engine,
      batteryCapacityKWhSnapshot: this.derivatives.find(x => x.id === raw.derivativeId!)?.batteryCapacityKWh,
      featureIds: Array.from(this.selectedFeatureIds)
    };
    this.api.createListing(dto)
      .pipe(finalize(() => { this.saving = false; this.form.enable({ emitEvent: false }); }))
      .subscribe({
        next: () => {
          const ref = this.notify.success('Listing created', 'View listings');
          ref.onAction().subscribe(() => {
            const el = document.getElementById('listings-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        },
        error: (e) => this.notify.error(typeof e === 'string' ? e : 'Failed to create listing')
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
        this.variants = vars.filter(v => allowedDerIds.has(v.derivativeId));
      });
  }
}
