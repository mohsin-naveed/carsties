import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-feature-edit-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Name</mat-label>
          <input #nameInput matInput formControlName="name" placeholder="e.g. Sunroof" cdkFocusInitial />
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" />
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
export class FeatureEditDialogComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  public ref: MatDialogRef<FeatureEditDialogComponent, { name: string; description?: string }> = inject(MatDialogRef);
  public data: { title: string; name?: string; description?: string } = inject(MAT_DIALOG_DATA);

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    name: [this.data.name ?? '', [Validators.required, Validators.maxLength(100)]],
    description: [this.data.description ?? '']
  });

  ngAfterViewInit(){ setTimeout(() => this.nameInput?.nativeElement.focus(), 0); }

  save(){
    const raw = this.form.getRawValue();
    this.ref.close({ name: raw.name!, description: raw.description || undefined });
  }
}
