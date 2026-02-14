import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated$!: Observable<boolean>;
  private readonly desiredTypeKey = 'carsties.desiredUserType';

  constructor(private oidcAuthService: OidcSecurityService) {
    this.isAuthenticated$ = this.oidcAuthService.isAuthenticated$.pipe(
      map(result => result.isAuthenticated)
    );
  }

  handleCallback(): void {
    this.oidcAuthService.checkAuth().subscribe();
  }

  login(): void {
    this.oidcAuthService.authorize();
  }

  logout(): void {
    // Trigger full server-side sign-out and token revocation.
    this.oidcAuthService.logoffAndRevokeTokens().subscribe();
  }

  getAccessToken(): Observable<string> {
    return this.oidcAuthService.getAccessToken();
  }

  register(accountType: 'Individual' | 'Dealer'): void {
    // IdentityService registration is email+password only. We keep the selected type locally
    // and complete the profile after the first login.
    localStorage.setItem(this.desiredTypeKey, accountType);
    // Identity UI expects a returnUrl value (used to route back after registration/login)
    const returnUrl = window.location.href;
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
