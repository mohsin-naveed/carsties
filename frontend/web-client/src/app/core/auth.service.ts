import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, defer } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated$!: Observable<boolean>;
  private readonly desiredTypeKey = 'carsties.desiredUserType';
  private readonly postLoginRedirectKey = 'carsties.postLoginRedirect';
  private readonly authCheck$ = defer(() => this.oidcAuthService.checkAuth()).pipe(shareReplay(1));

  constructor(private oidcAuthService: OidcSecurityService, private router: Router) {
    this.isAuthenticated$ = this.oidcAuthService.isAuthenticated$.pipe(
      map(result => result.isAuthenticated)
    );
  }

  /**
   * Ensures OIDC callback processing has run and returns the resulting auth state.
   * Shared across subscribers to avoid repeated processing.
   */
  ensureAuth$(): Observable<boolean> {
    return this.authCheck$.pipe(map(({ isAuthenticated }) => isAuthenticated));
  }

  peekPostLoginRedirect(): string | null {
    return localStorage.getItem(this.postLoginRedirectKey);
  }

  handleCallback(): void {
    this.authCheck$.subscribe(({ isAuthenticated }) => {
      if (!isAuthenticated) return;

      const redirect = localStorage.getItem(this.postLoginRedirectKey);
      if (!redirect) return;
      localStorage.removeItem(this.postLoginRedirectKey);

      // Avoid looping if we're already at the target.
      if (this.router.url === redirect) return;
      this.router.navigateByUrl(redirect);
    });
  }

  login(returnUrl?: string): void {
    if (returnUrl) {
      localStorage.setItem(this.postLoginRedirectKey, returnUrl);
    }
    this.oidcAuthService.authorize();
  }

  logout(): void {
    // Trigger server-side sign-out; IdentityServer will redirect back to the SPA
    // using the configured postLogoutRedirectUri.
    this.oidcAuthService.logoffAndRevokeTokens().subscribe({
      error: () => this.oidcAuthService.logoff().subscribe()
    });
  }

  logoutLocal(): void {
    // Local logout only (used for cancel flows where we want to stay in the SPA).
    this.oidcAuthService.logoffLocal();
  }

  getAccessToken(): Observable<string> {
    return this.oidcAuthService.getAccessToken();
  }

  register(accountType: 'Individual' | 'Dealer'): void {
    // IdentityService registration is email+password only. We keep the selected type locally
    // and complete the profile after the first login.
    localStorage.setItem(this.desiredTypeKey, accountType);
    // Identity UI expects a returnUrl value (used to route back after registration/login)
    const returnUrl = `${window.location.origin}/complete-profile?returnUrl=${encodeURIComponent('/')}`;
    const registerUrl = `${environment.identityAuthority}/Account/Register?returnUrl=${encodeURIComponent(returnUrl)}`;
    window.location.href = registerUrl;
  }

  consumeDesiredUserType(): 'Individual' | 'Dealer' | null {
    const v = localStorage.getItem(this.desiredTypeKey);
    localStorage.removeItem(this.desiredTypeKey);
    if (v === 'Individual' || v === 'Dealer') return v;
    return null;
  }
}
