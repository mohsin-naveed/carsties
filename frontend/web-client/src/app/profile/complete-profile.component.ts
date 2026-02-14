import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileApiService, UserType } from './profile-api.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompleteProfileComponent {
  private fb = inject(FormBuilder);
  private api = inject(ProfileApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);

  saving = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    userType: ['Individual' as UserType, [Validators.required]],
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    phoneNumber: ['', [Validators.required, Validators.maxLength(32)]],
    country: [''],
    city: [''],
    companyName: [''],
    companyRegistrationNumber: ['']
  });

  constructor() {
    const desiredType = (this.route.snapshot.queryParamMap.get('type') ?? '') as UserType;
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';

    if (desiredType === 'Individual' || desiredType === 'Dealer') {
      this.form.patchValue({ userType: desiredType });
    }

    // If profile already exists, prefill to reduce friction.
    this.api.getMe().subscribe({
      next: me => {
        this.form.patchValue({
          email: me.email,
          userType: me.userType,
          displayName: me.displayName ?? '',
          phoneNumber: me.phoneNumber ?? '',
          country: me.country ?? '',
          city: me.city ?? '',
          companyName: me.companyName ?? '',
          companyRegistrationNumber: me.companyRegistrationNumber ?? ''
        });

        if (me.isProfileComplete) {
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: () => {
        // no profile yet (404) - that's fine; user will create it
      }
    });
  }

  get isDealer(): boolean {
    return this.form.value.userType === 'Dealer';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';

    this.saving = true;
    this.api.upsertMe({
      email: this.form.value.email!,
      userType: this.form.value.userType!,
      displayName: this.form.value.displayName!,
      phoneNumber: this.form.value.phoneNumber!,
      country: this.form.value.country ?? null,
      city: this.form.value.city ?? null,
      companyName: this.form.value.companyName ?? null,
      companyRegistrationNumber: this.form.value.companyRegistrationNumber ?? null
    }).subscribe({
      next: () => {
        this.saving = false;
        this.snack.open('Profile saved', 'Close', { duration: 2500 });
        this.router.navigateByUrl(returnUrl);
      },
      error: err => {
        this.saving = false;
        const msg = err?.error?.error ?? 'Failed to save profile';
        this.snack.open(msg, 'Close', { duration: 4000 });
      }
    });
  }
}
