import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface MakeEditData { title: string; name?: string; }

@Component({
  selector: 'app-make-edit-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <div mat-dialog-content>
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. BMW">
        </mat-form-field>
      </div>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="ref.close()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
      </div>
    </form>
  `,
  styles: [`.w-100{ width:100%; }`]
})
export class MakeEditDialogComponent {
  readonly form = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(100)]] });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MakeEditData,
    public ref: MatDialogRef<MakeEditDialogComponent, { name: string }>,
    private fb: FormBuilder
  ){
    if (data.name){ this.form.patchValue({ name: data.name }); }
  }

  save(){ if (this.form.valid){ this.ref.close(this.form.getRawValue()); } }
}
