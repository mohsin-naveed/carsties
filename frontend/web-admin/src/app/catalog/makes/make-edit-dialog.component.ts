import { Component, Inject } from '@angular/core';
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
  imports: [MatDialogModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSlideToggleModule, MatSelectModule, MatIconModule, MatDividerModule],
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
            <mat-option>
              <div class="filter">
                <mat-icon class="icon">search</mat-icon>
                <input matInput [(ngModel)]="countryFilter" placeholder="Search country" />
              </div>
            </mat-option>
            <mat-optgroup label="Popular">
              <mat-option *ngFor="let c of filteredPopularCountries()" [value]="c">{{ c }}</mat-option>
            </mat-optgroup>
            <mat-divider></mat-divider>
            <mat-optgroup label="All Countries">
              <mat-option *ngFor="let c of filteredOtherCountries()" [value]="c">{{ c }}</mat-option>
            </mat-optgroup>
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

  countryFilter = '';
  private readonly popular = [
    'Japan','Germany','China','France','United States','United Kingdom'
  ];
  // Basic list; can be expanded later
  private readonly countries = [
    'Argentina','Australia','Austria','Belgium','Brazil','Canada','China','Czech Republic','Denmark','Egypt','Finland','France','Germany','Hungary','India','Indonesia','Iran','Ireland','Italy','Japan','Malaysia','Mexico','Netherlands','Norway','Pakistan','Poland','Portugal','Romania','Russia','Saudi Arabia','Slovakia','South Africa','South Korea','Spain','Sweden','Switzerland','Taiwan','Thailand','Turkey','United Arab Emirates','United Kingdom','United States','Vietnam'
  ].sort();
  filteredPopularCountries(){
    const q = this.countryFilter.toLowerCase().trim();
    return this.popular.filter(c => c.toLowerCase().includes(q));
  }
  filteredOtherCountries(){
    const q = this.countryFilter.toLowerCase().trim();
    const popularSet = new Set(this.popular);
    return this.countries.filter(c => !popularSet.has(c) && c.toLowerCase().includes(q));
  }

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
