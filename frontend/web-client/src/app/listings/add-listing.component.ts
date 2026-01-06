import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { ObserversModule } from '@angular/cdk/observers';
import { ListingsApiService, MakeDto, ModelDto, GenerationDto, DerivativeDto, VariantDto, OptionDto, CreateListingDto, VariantFeatureSnapshot } from './listings-api.service';

@Component({
  selector: 'app-add-listing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ObserversModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule],
  templateUrl: './add-listing.component.html'
})
export class AddListingComponent {
  private fb = inject(FormBuilder);
  private api = inject(ListingsApiService);

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    year: [2022, [Validators.required, Validators.min(1900)]],
    mileage: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]],
    color: [''],
    makeId: [null as number | null, Validators.required],
    modelId: [null as number | null, Validators.required],
    generationId: [null as number | null, Validators.required],
    derivativeId: [null as number | null, Validators.required],
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

  constructor() {
    this.api.getMakes().subscribe(m => this.makes = m);
    this.api.getOptions().subscribe(o => { this.transmissions = o.transmissions; this.fuelTypes = o.fuelTypes; this.bodyTypes = o.bodyTypes; });

    this.form.get('makeId')!.valueChanges.subscribe(val => {
      this.models = []; this.form.patchValue({ modelId: null, generationId: null, derivativeId: null, variantId: null }, { emitEvent: false });
      if (val) this.api.getModels(val).subscribe(models => this.models = models);
    });
    this.form.get('modelId')!.valueChanges.subscribe(val => {
      this.generations = []; this.form.patchValue({ generationId: null, derivativeId: null, variantId: null }, { emitEvent: false });
      if (val) this.api.getGenerations(val).subscribe(gens => this.generations = gens);
      if (val) this.api.getDerivatives(val).subscribe(ders => this.derivatives = ders);
    });
    this.form.get('derivativeId')!.valueChanges.subscribe(val => {
      this.variants = []; this.form.patchValue({ variantId: null }, { emitEvent: false });
      if (val) {
        const der = this.derivatives.find(d => d.id === val);
        const genId = der?.generationId;
        if (genId) this.api.getVariantsByGeneration(genId).subscribe(vars => this.variants = vars);
      }
    });

    this.form.get('variantId')!.valueChanges.subscribe(variantId => {
      this.variantFeatures = [];
      if (variantId) this.api.getVariantFeatures(variantId).subscribe(vf => this.variantFeatures = vf);
    });
  }

  findById(list: { id: number }[], id: number | null | undefined) {
    if (id == null) return undefined as any;
    return list.find(x => x.id === id) as any;
  }

  submit() {
    if (this.form.invalid) return;
    const raw = this.form.value;
    const dto: CreateListingDto = {
      title: raw.title!, description: raw.description ?? undefined, year: raw.year!, mileage: raw.mileage!, price: raw.price!, color: raw.color ?? undefined,
      makeId: raw.makeId!, modelId: raw.modelId!, generationId: raw.generationId!, derivativeId: raw.derivativeId!, variantId: raw.variantId!,
      transmissionId: raw.transmissionId ?? undefined, fuelTypeId: raw.fuelTypeId ?? undefined, bodyTypeId: raw.bodyTypeId!,
      // snapshots
      makeName: this.makes.find(x => x.id === raw.makeId!)?.name,
      modelName: this.models.find(x => x.id === raw.modelId!)?.name,
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
      variantFeaturesJson: this.variantFeatures.length ? JSON.stringify(this.variantFeatures) : undefined
    };
    this.api.createListing(dto).subscribe({ next: () => alert('Listing created'), error: (e) => alert('Failed: ' + e) });
  }
}
