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
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { AuthService } from '../core/auth.service';

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
  private oidc = inject(OidcSecurityService);
  private auth = inject(AuthService);

  saving = false;
  private profileComplete = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    userType: ['Individual' as UserType, [Validators.required]],
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    phoneNumber: ['', [Validators.maxLength(32)]],
    country: [''],
    city: [''],
    companyName: [''],
    companyRegistrationNumber: ['']
  });

  constructor() {
    const desiredType = (this.route.snapshot.queryParamMap.get('type') ?? '') as UserType;
    const rawReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
    const returnUrl = rawReturnUrl.startsWith('/') ? rawReturnUrl : '/';

    if (desiredType === 'Individual' || desiredType === 'Dealer') {
      this.form.patchValue({ userType: desiredType });
    }

    // If no explicit query param, use the locally remembered choice from registration.
    if (desiredType !== 'Individual' && desiredType !== 'Dealer') {
      const remembered = this.auth.consumeDesiredUserType();
      if (remembered) this.form.patchValue({ userType: remembered });
    }

    // Email comes from IdentityServer; show it but prevent editing.
    this.oidc.getUserData().subscribe(userData => {
      const email = (userData?.email ?? userData?.Email ?? '') as string;
      if (email) {
        this.form.patchValue({ email });
      }
      this.form.get('email')?.disable({ emitEvent: false });
    });

    // Dealer-only required field.
    this.form.get('userType')?.valueChanges.subscribe(v => {
      const company = this.form.get('companyName');
      if (!company) return;

      if (v === 'Dealer') {
        company.setValidators([Validators.required, Validators.maxLength(200)]);
      } else {
        company.clearValidators();
      }
      company.updateValueAndValidity({ emitEvent: false });
    });

    // Apply initial validators for the current type.
    const initialType = this.form.value.userType;
    if (initialType === 'Dealer') {
      this.form.get('companyName')?.setValidators([Validators.required, Validators.maxLength(200)]);
      this.form.get('companyName')?.updateValueAndValidity({ emitEvent: false });
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

        this.form.get('email')?.disable({ emitEvent: false });

        this.profileComplete = !!me.isProfileComplete;
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
    // Enforce required fields per spec.
    const userType = this.form.getRawValue().userType;
    if (userType === 'Dealer' && !this.form.value.companyName?.trim()) {
      this.form.get('companyName')?.setErrors({ required: true });
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
    const returnUrl = rawReturnUrl.startsWith('/') ? rawReturnUrl : '/';

    this.saving = true;
    this.api.upsertMe({
      email: this.form.getRawValue().email!,
      userType: this.form.getRawValue().userType!,
      displayName: this.form.getRawValue().displayName!,
      phoneNumber: (this.form.getRawValue().phoneNumber ?? null) as any,
      country: this.form.value.country ?? null,
      city: this.form.value.city ?? null,
      companyName: this.form.value.companyName ?? null,
      companyRegistrationNumber: this.form.value.companyRegistrationNumber ?? null
    }).subscribe({
      next: me => {
        this.saving = false;
        if (me.isProfileComplete) {
          this.profileComplete = true;
          this.snack.open('Profile completed', 'Close', { duration: 2500 });
          this.router.navigateByUrl('/');
          return;
        }

        this.snack.open('Profile saved (still incomplete)', 'Close', { duration: 3500 });
        this.router.navigateByUrl(returnUrl);
      },
      error: err => {
        this.saving = false;
        const msg = err?.error?.error ?? 'Failed to save profile';
        this.snack.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  cancel(): void {
    // If profile is already complete, don't log out; just go home.
    if (this.profileComplete) {
      this.router.navigateByUrl('/');
      return;
    }

    // Cancel = server-side logout; IdentityServer will redirect back to the SPA home.
    this.auth.logout();
  }
}
