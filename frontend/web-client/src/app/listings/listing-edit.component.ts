import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ListingsApiService, ListingDto, UpdateListingDto, OptionDto, MakeDto, ModelDto, GenerationDto, DerivativeDto, VariantDto, FeatureDto, VariantFeatureSnapshot, ListingFeatureInputDto } from './listings-api.service';
import { NotificationService } from '../core/notification.service';
import { BehaviorSubject, forkJoin, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, shareReplay, startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ObserversModule } from '@angular/cdk/observers';
import { LocationApiService, CityDto, AreaDto } from '../location/location-api.service';

@Component({
  selector: 'app-listing-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ObserversModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatSelectModule, MatOptionModule, MatIconModule, MatCheckboxModule, MatTooltipModule, MatDividerModule, MatAutocompleteModule],
  styleUrls: ['./add-listing.component.scss'],
  template: `
  <form [formGroup]="form" (ngSubmit)="save()" class="sell-form" [attr.aria-busy]="saving">
    <h2 class="page-title" aria-label="Edit listing">Edit listing</h2>
    <mat-card class="section-card">
      <mat-card-content>
        <h3 class="step-head">
          <span class="step-head__num">1.</span> Car Information
        </h3>
        <div class="grid grid--car">
          <!-- City at top with typeahead and dropdown trigger -->
          <div class="field-check">
            <mat-form-field appearance="outline" [ngClass]="{'valid-field': !!form.get('cityId')?.value}">
              <mat-label>City</mat-label>
              <input type="text" matInput [matAutocomplete]="cityAuto" #cityTrigger="matAutocompleteTrigger" formControlName="citySearch" placeholder="Search or select city" />
              <button *ngIf="!cityLoading" mat-icon-button matSuffix type="button" aria-label="Open city options" (click)="openCityDropdown(cityTrigger)">
                <mat-icon>arrow_drop_down</mat-icon>
              </button>
              <mat-progress-spinner *ngIf="cityLoading" matSuffix diameter="16" strokeWidth="3" mode="indeterminate"></mat-progress-spinner>
              <mat-autocomplete #cityAuto="matAutocomplete" (optionSelected)="onCitySelected($event.option.value)">
                <mat-option *ngFor="let c of cities" [value]="c.id">{{c.name}}</mat-option>
              </mat-autocomplete>
            </mat-form-field>
          </div>

          <!-- Area directly under City -->
          <div class="field-check" *ngIf="form.value.cityId">
            <mat-form-field appearance="outline">
              <mat-label>Area</mat-label>
              <input type="text" matInput [matAutocomplete]="areaAuto" #areaTrigger="matAutocompleteTrigger" formControlName="areaSearch" placeholder="Search or select area" />
              <button *ngIf="!areaLoading" mat-icon-button matSuffix type="button" aria-label="Open area options" (click)="openAreaDropdown(areaTrigger)">
                <mat-icon>arrow_drop_down</mat-icon>
              </button>
              <mat-progress-spinner *ngIf="areaLoading" matSuffix diameter="16" strokeWidth="3" mode="indeterminate"></mat-progress-spinner>
              <mat-autocomplete #areaAuto="matAutocomplete" (optionSelected)="onAreaSelected($event.option.value)">
                <mat-option *ngFor="let a of areas" [value]="a.id">{{a.name}}</mat-option>
              </mat-autocomplete>
            </mat-form-field>
          </div>

          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Model Year</mat-label>
              <input matInput type="number" formControlName="year" />
            </mat-form-field>
          </div>

          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Make</mat-label>
              <mat-select formControlName="makeId">
                <mat-option *ngFor="let m of makes" [value]="m.id">{{m.name}}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Model</mat-label>
              <mat-select formControlName="modelId">
                <mat-option *ngFor="let m of models" [value]="m.id">{{m.name}}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Body Color aligned with Add Listing -->
          <div class="field-check">
            <mat-form-field appearance="outline" [ngClass]="{'valid-field': form.get('bodyColor')?.valid}">
              <mat-label>Body Color</mat-label>
              <mat-select formControlName="bodyColor" (selectionChange)="onBodyColorSelected()">
                <mat-option *ngFor="let c of bodyColors" [value]="c.name">
                  <span class="color-dot" [style.backgroundColor]="c.hex"></span>
                  {{c.name}}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Variant dropdown removed per requirements -->

          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Mileage</mat-label>
              <input matInput type="number" formControlName="mileage" />
            </mat-form-field>
          </div>
          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Price</mat-label>
              <input matInput type="number" formControlName="price" />
            </mat-form-field>
          </div>
          <div class="field-check grid-col-span-2">
            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput rows="3" formControlName="description"></textarea>
            </mat-form-field>
          </div>
        </div>
      </mat-card-content>

      <div class="step-divider"></div>
      <h3 class="step-head">
        <span class="step-head__num">2.</span> Additional Information
      </h3>
      <mat-card-content>
        <div class="grid grid--car">
          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Body Type</mat-label>
              <mat-select formControlName="bodyTypeId">
                <mat-option *ngFor="let b of bodyTypes" [value]="b.id">{{b.name}}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Transmission</mat-label>
              <mat-select formControlName="transmissionId">
                <mat-option *ngFor="let t of transmissions" [value]="t.id">{{t.name}}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Fuel Type</mat-label>
              <mat-select formControlName="fuelTypeId">
                <mat-option *ngFor="let f of fuelTypes" [value]="f.id">{{f.name}}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Engine Size (CC)</mat-label>
              <input matInput type="number" formControlName="engineSizeCC" />
            </mat-form-field>
          </div>
        </div>
        <div class="features">
          <div class="features__title">Features</div>
          <div class="features__grid">
            <mat-checkbox *ngFor="let f of features" color="primary"
              [checked]="selectedFeatureIds.has(f.id)"
              (change)="toggleFeature(f.id, $event.checked)">{{f.name}}</mat-checkbox>
          </div>
        </div>
      </mat-card-content>

      <div class="step-divider"></div>
      <h3 class="step-head">
        <span class="step-head__num">3.</span> Upload Images
      </h3>
      <mat-card-content>
        <div class="upload">
          <!-- Existing images on the listing -->
          <div class="upload__grid">
            <div class="upload__item" *ngFor="let img of listing?.images">
              <img [src]="img.thumbUrl || img.url" alt="image" />
              <div class="upload__actions">
                <button mat-icon-button color="warn" aria-label="Delete image" (click)="deleteImage(img.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- New uploads behave exactly like AddListingComponent -->
          <div class="upload__drop" [class.upload__drop--dragging]="dragging"
               (click)="fileInput.click()" (keydown.enter)="fileInput.click()" tabindex="0" role="button"
               aria-label="Upload images" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
            <mat-icon>cloud_upload</mat-icon>
            <div>Drag & drop images here or <button type="button" class="u-link-btn" (click)="fileInput.click(); $event.stopPropagation();">browse</button></div>
            <div class="upload__hint" matTooltip="JPG, PNG, WEBP up to 5MB. Aim for 6–10 photos.">JPG, PNG, WEBP • Max 5MB each</div>
          </div>
          <input #fileInput type="file" class="visually-hidden" multiple accept="image/*" (change)="onFilesSelected($event)" />

          <div class="upload__meta">Selected: {{ selectedFiles.length }} file(s)</div>

          <div class="upload__grid">
            <div class="upload__item" *ngFor="let p of previews; let i = index">
              <img [src]="p" alt="preview image" />
              <div class="upload__badge" *ngIf="i === 0">Cover</div>
              <div class="upload__actions">
                <button type="button" mat-icon-button aria-label="Set as cover" (click)="setCover(i)" *ngIf="i !== 0" matTooltip="Set as cover">
                  <mat-icon>star</mat-icon>
                </button>
                <button type="button" mat-icon-button aria-label="Remove image" (click)="removeImage(i)" matTooltip="Remove">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
          <button mat-stroked-button color="primary" type="button" (click)="uploadSelected()" [disabled]="!selectedFiles.length">Upload selected ({{selectedFiles.length}})</button>
        </div>
      </mat-card-content>

      <div class="step-divider"></div>
      <h3 class="step-head">
        <span class="step-head__num">4.</span> Contact Information
      </h3>
      <mat-card-content>
        <div class="grid grid--contact">
          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Name</mat-label>
              <input matInput formControlName="contactName" placeholder="Your full name" />
            </mat-form-field>
          </div>
          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Phone</mat-label>
              <input matInput type="tel" formControlName="contactPhone" placeholder="e.g. 07123 456789" />
            </mat-form-field>
          </div>
          <div class="field-check">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="contactEmail" placeholder="you@example.com" />
            </mat-form-field>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <div class="actions">
      <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || !form.dirty || saving">
        <mat-progress-spinner *ngIf="saving" mode="indeterminate" diameter="18" strokeWidth="3"></mat-progress-spinner>
        <span *ngIf="!saving">Update</span>
      </button>
    </div>
  </form>
  `
})
export class ListingEditComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ListingsApiService);
  private loc = inject(LocationApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private notify = inject(NotificationService);

  id!: number;
  saving = false;
  listing: ListingDto | null = null;
  transmissions: OptionDto[] = [];
  fuelTypes: OptionDto[] = [];
  bodyTypes: OptionDto[] = [];
  makes: MakeDto[] = [];
  models: ModelDto[] = [];
  generations: GenerationDto[] = [];
  derivatives: DerivativeDto[] = [];
  variants: VariantDto[] = [];
  features: FeatureDto[] = [];
  readonly makes$ = new BehaviorSubject<MakeDto[]>([]);
  readonly models$ = new BehaviorSubject<ModelDto[]>([]);
  readonly generations$ = new BehaviorSubject<GenerationDto[]>([]);
  readonly derivatives$ = new BehaviorSubject<DerivativeDto[]>([]);
  readonly variants$ = new BehaviorSubject<VariantDto[]>([]);
  readonly features$ = new BehaviorSubject<FeatureDto[]>([]);
  variantFeatures: VariantFeatureSnapshot[] = [];
  selectedFeatureIds = new Set<number>();
  selectedFiles: File[] = [];
  previews: string[] = [];
  coverIndex = 0;
  dragging = false;
  years: number[] = [];
  cities: CityDto[] = []; areas: AreaDto[] = [];
  cityLoading = false; cityError: string | null = null;
  areaLoading = false; areaError: string | null = null;
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

  form = this.fb.group({
    title: ['', Validators.required],
    year: [null as number | null, [Validators.required, Validators.min(1900)]],
    mileage: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    transmissionId: [null as number | null],
    fuelTypeId: [null as number | null],
    bodyTypeId: [null as number | null, Validators.required],
    makeId: [null as number | null, Validators.required],
    modelId: [null as number | null, Validators.required],
    generationId: [null as number | null],
    derivativeId: [null as number | null],
    variantId: [null as number | null],
    bodyColor: [null as string | null],
    engineSizeCC: [null as number | null],
    citySearch: [''], cityId: [null as number | null],
    areaSearch: [''], areaId: [null as number | null],
    contactName: ['', [Validators.maxLength(100)]],
    contactPhone: ['', [Validators.maxLength(30)]],
    contactEmail: ['', [Validators.email, Validators.maxLength(200)]]
  });

  ngOnInit() {
    // Years list
    const current = new Date().getFullYear();
    for (let y = current; y >= 1900; y--) this.years.push(y);
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    // City typeahead
    this.form.get('citySearch')!.valueChanges.pipe(startWith(''), takeUntilDestroyed(this.destroyRef)).subscribe(search => {
      const s = (search || '').toString();
      this.cityLoading = true; this.cityError = null;
      this.loc.searchCities(s).subscribe({
        next: items => { this.cities = items; this.cityLoading = false; },
        error: () => { this.cityLoading = false; this.cityError = 'Failed to load cities'; }
      });
    });
    // Area typeahead depends on selected city
    combineLatest([
      this.form.get('areaSearch')!.valueChanges.pipe(startWith('')),
      this.form.get('cityId')!.valueChanges.pipe(startWith(this.form.value.cityId))
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([search, cityId]) => {
      const s = (search || '').toString();
      this.areaLoading = true; this.areaError = null;
      this.loc.searchAreas(s, cityId ?? undefined).subscribe({
        next: items => { this.areas = items; this.areaLoading = false; },
        error: () => { this.areaLoading = false; this.areaError = 'Failed to load areas'; }
      });
    });
    this.api.getOptions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(o => { this.transmissions = o.transmissions; this.fuelTypes = o.fuelTypes; this.bodyTypes = o.bodyTypes; });
    this.api.getMakes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(m => { this.makes = m; this.makes$.next(m); });
    this.api.getFeatures().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(f => { this.features = f; this.features$.next(f); });
    this.api.getListing(this.id).subscribe({
      next: (l: ListingDto) => {
        this.listing = l;
        // Map codes back to IDs for form controls
        const makeId = this.makes.find(m => m.code === l.makeCode)?.id ?? null;
        this.form.patchValue({
          title: l.title,
          year: l.year,
          mileage: l.mileage,
          price: l.price,
          description: l.description ?? '',
          transmissionId: this.transmissions.find(t => t.code === l.transmissionTypeCode)?.id ?? null,
          fuelTypeId: this.fuelTypes.find(f => f.code === l.fuelTypeCode)?.id ?? null,
          bodyTypeId: this.bodyTypes.find(b => b.code === l.bodyTypeCode)?.id ?? null,
          makeId,
          modelId: null,
          generationId: null,
          derivativeId: null,
          variantId: null,
          engineSizeCC: l.engineSizeCC ?? null,
          bodyColor: l.bodyColor ?? l.color ?? null,
          citySearch: l.cityName ?? '',
          areaSearch: l.areaName ?? '',
          contactName: l.contactName ?? '',
          contactPhone: l.contactPhone ?? '',
          contactEmail: l.contactEmail ?? ''
        });
        // Preselect listing features by codes returned from API
        const codes = (l.features ? l.features.map(f => f.featureCode) : (l.featureCodes ?? [])) ?? [];
        for (const code of codes) {
          const fid = this.features.find(x => x.code === code)?.id;
          if (fid) this.selectedFeatureIds.add(fid);
        }
        // Load models/generations/derivatives for make
        this.api.getModels(makeId ?? undefined).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(models => {
          this.models = models;
          this.models$.next(models);
          const genReqs = models.map(m => this.api.getGenerations(m.id));
          const derReqs = models.map(m => this.api.getDerivatives(m.id));
          forkJoin({ gens: forkJoin(genReqs).pipe(map(groups => groups.flat())), ders: forkJoin(derReqs).pipe(map(groups => groups.flat())) })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(({ gens, ders }) => {
              this.generations = gens;
              this.derivatives = ders;
              this.generations$.next(gens);
              this.derivatives$.next(ders);
              this.refreshVariants();
              // Map codes back to IDs and set variant features
              const modelId = models.find(m => m.code === l.modelCode)?.id ?? null;
              const genId = gens.find(g => g.code === l.generationCode)?.id ?? null;
              const derId = ders.find(d => d.code === l.derivativeCode)?.id ?? null;
              const variant = this.variants.find(v => v.code === l.variantCode);
              this.form.patchValue({ modelId, generationId: genId, derivativeId: derId, variantId: variant?.id ?? null }, { emitEvent: false });
              if (variant?.id) {
                this.api.getVariantFeatures(variant.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(vf => {
                  this.variantFeatures = vf;
                });
              }
            });
        });
      }
    });
  }

  onCitySelected(id: number) {
    const city = this.cities.find(c => c.id === id);
    this.form.patchValue({ cityId: id, citySearch: city?.name ?? '', areaId: null, areaSearch: '' }, { emitEvent: false });
  }
  onAreaSelected(id: number) {
    const area = this.areas.find(a => a.id === id);
    this.form.patchValue({ areaId: id, areaSearch: area?.name ?? '' }, { emitEvent: false });
  }

  openCityDropdown(trigger: any) {
    this.form.get('citySearch')!.setValue('');
    setTimeout(() => trigger.openPanel(), 0);
  }
  openAreaDropdown(trigger: any) {
    this.form.get('areaSearch')!.setValue('');
    setTimeout(() => trigger.openPanel(), 0);
  }
  onBodyColorSelected() { /* no-op, reserved for focus chaining */ }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const derivative = this.derivatives.find(d => d.id === (this.form.value.derivativeId ?? undefined));
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
    const dto: UpdateListingDto = {
      title: this.form.value.title ?? undefined,
      year: this.form.value.year ?? undefined,
      mileage: this.form.value.mileage ?? undefined,
      price: this.form.value.price ?? undefined,
      description: this.form.value.description ?? undefined,
      transmissionTypeCode: (this.form.value.transmissionId ? this.transmissions.find(t => t.id === this.form.value.transmissionId!)?.code : undefined),
      fuelTypeCode: (this.form.value.fuelTypeId ? this.fuelTypes.find(f => f.id === this.form.value.fuelTypeId!)?.code : undefined),
      bodyTypeCode: (this.form.value.bodyTypeId ? this.bodyTypes.find(b => b.id === this.form.value.bodyTypeId!)?.code : undefined),
      makeCode: (this.form.value.makeId ? this.makes.find(m => m.id === this.form.value.makeId!)?.code : undefined),
      modelCode: (this.form.value.modelId ? this.models.find(m => m.id === this.form.value.modelId!)?.code : undefined),
      generationCode: (this.form.value.generationId ? this.generations.find(g => g.id === this.form.value.generationId!)?.code : undefined),
      derivativeCode: (this.form.value.derivativeId ? this.derivatives.find(d => d.id === this.form.value.derivativeId!)?.code : undefined),
      variantCode: (this.form.value.variantId ? this.variants.find(v => v.id === this.form.value.variantId!)?.code : undefined),
      bodyColor: this.form.value.bodyColor ?? undefined,
      seats: derivative?.seats,
      doors: derivative?.doors,
      engineSizeCC: this.form.value.engineSizeCC ?? derivative?.engineCC ?? undefined,
      features: featureInputs,
      contactName: this.form.value.contactName ?? undefined,
      contactPhone: this.form.value.contactPhone ?? undefined,
      contactEmail: this.form.value.contactEmail ?? undefined
    };
    this.api.updateListing(this.id, dto).subscribe({
      next: (updated: ListingDto) => {
        this.saving = false;
        this.notify.success('Listing updated');
        this.listing = updated;
        // Optionally update form fields if needed
        this.form.patchValue({
          title: updated.title,
          year: updated.year,
          mileage: updated.mileage,
          price: updated.price,
          description: updated.description ?? '',
          transmissionId: this.transmissions.find(t => t.code === updated.transmissionTypeCode)?.id ?? null,
          fuelTypeId: this.fuelTypes.find(f => f.code === updated.fuelTypeCode)?.id ?? null,
          bodyTypeId: this.bodyTypes.find(b => b.code === updated.bodyTypeCode)?.id ?? null,
          contactName: updated.contactName ?? '',
          contactPhone: updated.contactPhone ?? '',
          contactEmail: updated.contactEmail ?? '',
        }, { emitEvent: false });
        // Update selected features
        this.selectedFeatureIds.clear();
        const codes = (updated.features ? updated.features.map(f => f.featureCode) : (updated.featureCodes ?? [])) ?? [];
        for (const code of codes) {
          const fid = this.features.find(x => x.code === code)?.id;
          if (fid) this.selectedFeatureIds.add(fid);
        }
      },
      error: () => { this.saving = false; }
    });
  }

  cancel() { this.router.navigate(['/']); }

  onFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    const list = files ? Array.from(files) : [];
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
    this.previews.forEach(url => URL.revokeObjectURL(url));
    this.previews = this.selectedFiles.map(f => URL.createObjectURL(f));
    // Default first selected image as cover
    this.coverIndex = this.selectedFiles.length > 0 ? 0 : 0;
  }

  uploadSelected() {
    if (!this.selectedFiles.length) return;
    this.api.uploadListingImages(this.id, this.selectedFiles).subscribe({
      next: () => { this.refreshListing(); this.clearSelected(); },
      error: () => { /* surface via global error handler */ }
    });
  }

  deleteImage(imageId: number) {
    this.api.deleteListingImage(this.id, imageId).subscribe({
      next: () => this.refreshListing(),
      error: () => { /* surface via global error handler */ }
    });
  }

  private clearSelected() {
    this.selectedFiles = [];
    this.previews.forEach(url => URL.revokeObjectURL(url));
    this.previews = [];
    this.coverIndex = 0;
  }

  private refreshListing() {
    this.api.getListing(this.id).subscribe(l => {
      this.listing = l;
      this.form.patchValue({
        title: l.title,
        year: l.year,
        mileage: l.mileage,
        price: l.price,
        description: l.description ?? '',
        transmissionId: this.transmissions.find(t => t.code === l.transmissionTypeCode)?.id ?? null,
        fuelTypeId: this.fuelTypes.find(f => f.code === l.fuelTypeCode)?.id ?? null,
        bodyTypeId: this.bodyTypes.find(b => b.code === l.bodyTypeCode)?.id ?? null,
        bodyColor: l.bodyColor ?? l.color ?? null,
        contactName: l.contactName ?? '',
        contactPhone: l.contactPhone ?? '',
        contactEmail: l.contactEmail ?? '',
      }, { emitEvent: false });
    });
  }

  toggleFeature(featureId: number, checked: boolean) {
    if (checked) this.selectedFeatureIds.add(featureId);
    else this.selectedFeatureIds.delete(featureId);
  }

  // Allow choosing which newly selected image will be used as cover by
  // moving it to index 0, mirroring AddListingComponent behavior.
  setCover(i: number) {
    if (i < 0 || i >= this.selectedFiles.length) return;
    if (i === 0) { this.coverIndex = 0; return; }
    const file = this.selectedFiles.splice(i, 1)[0];
    const prev = this.previews.splice(i, 1)[0];
    this.selectedFiles.unshift(file);
    this.previews.unshift(prev);
    this.coverIndex = 0;
  }

  removeImage(i: number) {
    if (i < 0 || i >= this.selectedFiles.length) return;
    const [file] = this.selectedFiles.splice(i, 1);
    const [url] = this.previews.splice(i, 1);
    try { if (url) URL.revokeObjectURL(url); } catch {}
    if (this.coverIndex === i) this.coverIndex = 0;
    if (this.coverIndex > i) this.coverIndex--;
  }

  // Drag & drop helpers, same behavior as AddListingComponent
  onDragOver(event: DragEvent) { event.preventDefault(); this.dragging = true; }
  onDragLeave(event: DragEvent) { event.preventDefault(); this.dragging = false; }
  onDrop(event: DragEvent) {
    event.preventDefault(); this.dragging = false;
    const files = event.dataTransfer?.files; if (!files || files.length === 0) return;
    const inputEvent = { target: { files } } as any as Event;
    this.onFilesSelected(inputEvent);
  }

  private refreshVariants() {
    const makeId = this.form.value.makeId;
    const modelId = this.form.value.modelId;
    const year = this.form.value.year;
    if (!makeId || !year) return;
    const allowedModelIds = new Set(this.models.map(m => m.id));
    const gensForYear = this.generations.filter(g => {
      const start = g.startYear ?? 0;
      const end = g.endYear ?? 9999;
      const inYear = (year as number) >= start && (year as number) <= end;
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
        this.variants = filtered;
        this.variants$.next(filtered);
      });
  }
}
