import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { A11yModule } from '@angular/cdk/a11y';
import { MakeDto } from '../catalog-api.service';

@Component({
  selector: 'app-model-edit-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Make</mat-label>
          <mat-select formControlName="makeId" cdkFocusInitial>
            <mat-option *ngFor="let m of data.makes" [value]="m.id">{{ m.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. 3 Series" />
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
  `]
})
export class ModelEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  public ref: MatDialogRef<ModelEditDialogComponent, { name: string; makeId: number }> = inject(MatDialogRef);
  public data: { title: string; name?: string; makeId?: number; makes: MakeDto[] } = inject(MAT_DIALOG_DATA);


  readonly form = this.fb.group({
    name: [this.data.name ?? '', [Validators.required, Validators.maxLength(100)]],
    makeId: [this.data.makeId ?? null as number | null, [Validators.required]]
  });

  save(){
    const raw = this.form.getRawValue();
    this.ref.close({ name: raw.name!, makeId: raw.makeId! });
  }
}
