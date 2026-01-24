import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ListingsApiService, ListingDto, UpdateListingDto, OptionDto, MakeDto, ModelDto, GenerationDto, DerivativeDto, VariantDto, FeatureDto, VariantFeatureSnapshot } from './listings-api.service';
import { NotificationService } from '../core/notification.service';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { map, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-listing-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule, MatSelectModule, MatOptionModule, MatIconModule, MatCheckboxModule],
  template: `
  <mat-card>
    <h2>Edit Listing</h2>
    <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
      <mat-form-field appearance="outline"><mat-label>Title</mat-label>
        <input matInput formControlName="title" />
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Year</mat-label>
        <input matInput type="number" formControlName="year" />
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Mileage</mat-label>
        <input matInput type="number" formControlName="mileage" />
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Price</mat-label>
        <input matInput type="number" formControlName="price" />
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Description</mat-label>
        <textarea matInput rows="3" formControlName="description"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline"><mat-label>Make</mat-label>
        <mat-select formControlName="makeId">
          <mat-option *ngFor="let m of makes" [value]="m.id">{{m.name}}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Model</mat-label>
        <mat-select formControlName="modelId">
          <mat-option *ngFor="let m of models" [value]="m.id">{{m.name}}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Variant</mat-label>
        <mat-select formControlName="variantId">
          <mat-option *ngFor="let v of variants" [value]="v.id">{{v.name}}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline"><mat-label>Transmission</mat-label>
        <mat-select formControlName="transmissionId">
          <mat-option *ngFor="let t of transmissions" [value]="t.id">{{t.name}}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Fuel Type</mat-label>
        <mat-select formControlName="fuelTypeId">
          <mat-option *ngFor="let f of fuelTypes" [value]="f.id">{{f.name}}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Body Type</mat-label>
        <mat-select formControlName="bodyTypeId">
          <mat-option *ngFor="let b of bodyTypes" [value]="b.id">{{b.name}}</mat-option>
        </mat-select>
      </mat-form-field>

      <div class="actions">
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
          <mat-progress-spinner *ngIf="saving" mode="indeterminate" diameter="18" strokeWidth="3"></mat-progress-spinner>
          <span *ngIf="!saving">Save</span>
        </button>
      </div>
    </form>
  </mat-card>

  <mat-card style="margin-top:16px;">
    <h3>Images</h3>
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <div *ngFor="let img of listing?.images" style="position:relative;">
        <img [src]="img.thumbUrl || img.url" alt="image" style="width:140px; height:105px; object-fit:cover; border-radius:4px; border:1px solid #ddd;" />
        <button mat-icon-button color="warn" title="Delete" (click)="deleteImage(img.id)" style="position:absolute; top:4px; right:4px; background:#fff;">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </div>
    <div style="margin-top:12px;">
      <input type="file" multiple accept="image/*" (change)="onFilesSelected($event)" />
      <button mat-stroked-button color="primary" (click)="uploadSelected()" [disabled]="!selectedFiles.length">Upload selected ({{selectedFiles.length}})</button>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
        <img *ngFor="let p of previews" [src]="p" style="width:120px; height:90px; object-fit:cover; border-radius:4px; border:1px solid #ddd;" alt="preview" />
      </div>
    </div>
  </mat-card>

  <mat-card style="margin-top:16px;">
    <h3>Additional Information</h3>
    <div><strong>Features</strong></div>
    <div style="display:flex; flex-wrap:wrap; gap:12px;">
      <ng-container *ngFor="let f of features">
        <mat-checkbox color="primary"
                      [checked]="selectedFeatureIds.has(f.id)"
                      (change)="toggleFeature(f.id, $event.checked)">
          {{f.name}}
        </mat-checkbox>
      </ng-container>
    </div>
  </mat-card>
  `
})
export class ListingEditComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ListingsApiService);
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
    variantId: [null as number | null, Validators.required]
  });

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
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
          variantId: null
        });
        // Preselect listing features
        (l.featureIds ?? []).forEach(id => this.selectedFeatureIds.add(id));
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

  save() {
    if (this.form.invalid) return;
    this.saving = true;
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
      featureIds: Array.from(this.selectedFeatureIds)
    };
    this.api.updateListing(this.id, dto).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Listing updated');
        this.refreshListing();
      },
      error: () => { this.saving = false; }
    });
  }

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
      }, { emitEvent: false });
    });
  }

  toggleFeature(featureId: number, checked: boolean) {
    if (checked) this.selectedFeatureIds.add(featureId);
    else this.selectedFeatureIds.delete(featureId);
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
