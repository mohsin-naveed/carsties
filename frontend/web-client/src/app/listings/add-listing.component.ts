import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { ObserversModule } from '@angular/cdk/observers';
import { ListingsApiService, MakeDto, ModelDto, GenerationDto, DerivativeDto, VariantDto, OptionDto, CreateListingDto } from './listings-api.service';

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
      if (val) this.api.getVariants(val).subscribe(vars => this.variants = vars);
    });
  }

  submit() {
    if (this.form.invalid) return;
    const dto = this.form.value as unknown as CreateListingDto;
    this.api.createListing(dto).subscribe({ next: () => alert('Listing created'), error: (e) => alert('Failed: ' + e) });
  }
}
