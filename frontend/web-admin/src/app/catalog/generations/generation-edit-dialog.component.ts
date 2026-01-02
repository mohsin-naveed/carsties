import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { A11yModule } from '@angular/cdk/a11y';
import { MakeDto, ModelDto } from '../catalog-api.service';

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
  public ref: MatDialogRef<GenerationEditDialogComponent, { name: string; modelId: number; startYear?: number; endYear?: number }> = inject(MatDialogRef);
  public data: { title: string; name?: string; makeId?: number; modelId?: number; startYear?: number; endYear?: number; models: ModelDto[]; makes: MakeDto[] } = inject(MAT_DIALOG_DATA);

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    name: [this.data.name ?? '', [Validators.required, Validators.maxLength(100)]],
    makeId: [this.data.makeId ?? this.deriveMakeIdFromModel(this.data.modelId) ?? null as number | null, [Validators.required]],
    modelId: [this.data.modelId ?? null as number | null, [Validators.required]],
    startYear: [this.data.startYear ?? null],
    endYear: [this.data.endYear ?? null]
  });

  ngAfterViewInit(){ setTimeout(() => this.nameInput?.nativeElement.focus(), 0); }

  private deriveMakeIdFromModel(modelId?: number){
    if (!modelId) return null;
    const m = this.data.models.find(x => x.id === modelId);
    return m ? m.makeId : null;
  }

  constructor(){
    // When make changes, clear model selection to force a valid pick
    this.form.get('makeId')!.valueChanges.subscribe(() => {
      this.form.get('modelId')!.setValue(null);
    });
  }

  filteredModels(): ModelDto[] {
    const makeId = this.form.value.makeId as number | null;
    if (!makeId) return [];
    return this.data.models.filter(m => m.makeId === makeId);
  }

  save(){
    const raw = this.form.getRawValue();
    this.ref.close({
      name: raw.name!,
      modelId: raw.modelId!,
      startYear: raw.startYear ?? undefined,
      endYear: raw.endYear ?? undefined
    });
  }
}
