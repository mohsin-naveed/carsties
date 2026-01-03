import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { A11yModule } from '@angular/cdk/a11y';
import { GenerationDto, MakeDto, ModelDto, OptionDto } from '../catalog-api.service';

@Component({
  selector: 'app-variant-edit-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Make</mat-label>
          <mat-select formControlName="makeId">
            <mat-option *ngFor="let mk of data.makes" [value]="mk.id">{{ mk.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Model</mat-label>
          <mat-select formControlName="modelId" [disabled]="!form.value.makeId">
            <mat-option *ngFor="let md of filteredModels()" [value]="md.id">{{ md.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Generation</mat-label>
          <mat-select formControlName="generationId" [disabled]="!form.value.modelId">
            <mat-option *ngFor="let gen of filteredGenerations()" [value]="gen.id">{{ gen.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Name</mat-label>
          <input #nameInput matInput formControlName="name" placeholder="e.g. 2.0 TDI" cdkFocusInitial />
        </mat-form-field>
        
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
    </div>
  `,
  styles: [`
    .form { display:flex; flex-direction:column; gap:1rem; }
    .grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; }
    @media (max-width: 768px){ .grid { grid-template-columns: 1fr; } }
  `]
})
export class VariantEditDialogComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  public ref: MatDialogRef<VariantEditDialogComponent, { name: string; generationId: number }> = inject(MatDialogRef);
  public data: { title: string; name?: string; generationId?: number; generations: GenerationDto[]; models: ModelDto[]; makes: MakeDto[] } = inject(MAT_DIALOG_DATA);

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    name: [this.data.name ?? '', [Validators.required, Validators.maxLength(100)]],
    makeId: [this.deriveMakeId(this.data.generationId) ?? null as number | null, [Validators.required]],
    modelId: [this.deriveModelId(this.data.generationId) ?? null as number | null, [Validators.required]],
    generationId: [this.data.generationId ?? null as number | null, [Validators.required]],
    
  });

  ngAfterViewInit(){ setTimeout(() => this.nameInput?.nativeElement.focus(), 0); }

  filteredModels(): ModelDto[] {
    const makeId = this.form.value.makeId as number | null;
    if (!makeId) return [];
    return this.data.models.filter(m => m.makeId === makeId);
  }
  filteredGenerations(): GenerationDto[] {
    const modelId = this.form.value.modelId as number | null;
    if (!modelId) return [];
    return this.data.generations.filter(g => g.modelId === modelId);
  }
  private deriveMakeId(generationId?: number){
    if (!generationId) return null;
    const gen = this.data.generations.find(g => g.id === generationId);
    if (!gen) return null;
    const model = this.data.models.find(m => m.id === gen.modelId);
    return model ? model.makeId : null;
  }
  private deriveModelId(generationId?: number){
    if (!generationId) return null;
    const gen = this.data.generations.find(g => g.id === generationId);
    if (!gen) return null;
    return gen.modelId ?? null;
  }

  save(){
    const raw = this.form.getRawValue();
    this.ref.close({ name: raw.name!, generationId: raw.generationId! });
  }
}
