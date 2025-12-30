import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { A11yModule } from '@angular/cdk/a11y';
import { MakeDto, ModelBodyDto, ModelDto } from '../catalog-api.service';

@Component({
  selector: 'app-generation-edit-dialog',
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
            <mat-option *ngFor="let m of filteredModels()" [value]="m.id">{{ m.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Model Body</mat-label>
          <mat-select formControlName="modelBodyId" [disabled]="!form.value.modelId">
            <mat-option *ngFor="let mb of filteredModelBodies()" [value]="mb.id">
              {{ mb.bodyType || 'Body' }} — {{ mb.seats }} seats / {{ mb.doors }} doors
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Name</mat-label>
          <input #nameInput matInput formControlName="name" placeholder="e.g. E90" cdkFocusInitial />
        </mat-form-field>
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>Start Year</mat-label>
            <input matInput type="number" formControlName="startYear" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>End Year</mat-label>
            <input matInput type="number" formControlName="endYear" />
          </mat-form-field>
        </div>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
    </div>
  `,
  styles: [`
    .form { display:flex; flex-direction:column; gap:1rem; }
    .grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
    @media (max-width: 768px){ .grid { grid-template-columns: 1fr; } }
  `]
})
export class GenerationEditDialogComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  public ref: MatDialogRef<GenerationEditDialogComponent, { name: string; modelBodyId: number; startYear?: number; endYear?: number }> = inject(MatDialogRef);
  public data: { title: string; name?: string; makeId?: number; modelBodyId?: number; startYear?: number; endYear?: number; models: ModelDto[]; makes: MakeDto[]; modelBodies: ModelBodyDto[] } = inject(MAT_DIALOG_DATA);

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    name: [this.data.name ?? '', [Validators.required, Validators.maxLength(100)]],
    makeId: [this.data.makeId ?? this.deriveMakeIdFromModelBody(this.data.modelBodyId) ?? null as number | null, [Validators.required]],
    modelId: [this.deriveModelIdFromModelBody(this.data.modelBodyId) ?? null as number | null, [Validators.required]],
    modelBodyId: [this.data.modelBodyId ?? null as number | null, [Validators.required]],
    startYear: [this.data.startYear ?? null],
    endYear: [this.data.endYear ?? null]
  });

  ngAfterViewInit(){ setTimeout(() => this.nameInput?.nativeElement.focus(), 0); }

  private deriveModelIdFromModelBody(modelBodyId?: number){
    if (!modelBodyId) return null;
    const mb = this.data.modelBodies.find(x => x.id === modelBodyId);
    return mb ? mb.modelId : null;
  }

  private deriveMakeIdFromModelBody(modelBodyId?: number){
    const modelId = this.deriveModelIdFromModelBody(modelBodyId ?? undefined);
    if (!modelId) return null;
    const m = this.data.models.find(x => x.id === modelId);
    return m ? m.makeId : null;
  }

  constructor(){
    // When make changes, clear model selection to force a valid pick
    this.form.get('makeId')!.valueChanges.subscribe(() => {
      this.form.get('modelId')!.setValue(null);
      this.form.get('modelBodyId')!.setValue(null);
    });

    // When model changes, clear modelBody selection to force valid pick
    this.form.get('modelId')!.valueChanges.subscribe(() => {
      this.form.get('modelBodyId')!.setValue(null);
    });
  }

  filteredModels(): ModelDto[] {
    const makeId = this.form.value.makeId as number | null;
    if (!makeId) return [];
    return this.data.models.filter(m => m.makeId === makeId);
  }

  filteredModelBodies(): ModelBodyDto[] {
    const modelId = this.form.value.modelId as number | null;
    if (!modelId) return [];
    return this.data.modelBodies.filter(mb => mb.modelId === modelId);
  }

  save(){
    const raw = this.form.getRawValue();
    this.ref.close({
      name: raw.name!,
      modelBodyId: raw.modelBodyId!,
      startYear: raw.startYear ?? undefined,
      endYear: raw.endYear ?? undefined
    });
  }
}
