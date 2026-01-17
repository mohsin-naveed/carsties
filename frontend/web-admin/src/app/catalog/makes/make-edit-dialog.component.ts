import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface MakeEditData { title: string; name?: string; country?: string; isActive?: boolean; isPopular?: boolean; }

@Component({
  selector: 'app-make-edit-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSlideToggleModule, MatSelectModule, MatIconModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <div mat-dialog-content>
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. BMW">
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Country</mat-label>
          <mat-select formControlName="country">
            <mat-option *ngFor="let c of countries" [value]="c">{{ c }}</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="toggles">
          <mat-slide-toggle formControlName="isActive">Active</mat-slide-toggle>
          <mat-slide-toggle formControlName="isPopular">Popular</mat-slide-toggle>
        </div>
      </div>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="ref.close()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
      </div>
    </form>
  `,
  styles: [`.w-100{ width:100%; } .toggles{ display:flex; gap:1rem; } .filter{ display:flex; align-items:center; gap:.5rem; padding:.25rem .5rem; } .filter .icon{ opacity:.6; }`]
})
export class MakeEditDialogComponent {
  readonly form = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(100)]], country: [''], isActive: [true], isPopular: [false] });

  public readonly countries = [
    'Japan',
    'China',
    'South Korea',
    'France',
    'Germany',
    'Malaysia',
    'United Kingdom',
    'United States',
    'Pakistan',
    'Argentina',
    'Australia',
    'Brazil',
    'Canada',
    'Czech Republic',
    'India',
    'Indonesia',
    'Iran',
    'Italy',
    'Mexico',
    'Russia',
    'South Africa',
    'Spain',
    'Sweden',
    'Thailand',
    'Turkey',
    'Vietnam'
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MakeEditData,
    public ref: MatDialogRef<MakeEditDialogComponent, { name: string }>,
    private fb: FormBuilder
  ){
    if (data.name){ this.form.patchValue({ name: data.name }); }
    if (data.country !== undefined){ this.form.patchValue({ country: data.country ?? '' }); }
    if (data.isActive !== undefined){ this.form.patchValue({ isActive: !!data.isActive }); }
    if (data.isPopular !== undefined){ this.form.patchValue({ isPopular: !!data.isPopular }); }
  }

  save(){ if (this.form.valid){ this.ref.close(this.form.getRawValue()); } }
}
