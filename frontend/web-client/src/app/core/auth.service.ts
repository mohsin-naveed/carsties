import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated$!: Observable<boolean>;

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
    this.oidcAuthService.logoff();
  }

  getAccessToken(): Observable<string> {
    return this.oidcAuthService.getAccessToken();
  }

  register(accountType: 'Individual' | 'Dealer'): void {
    const registerUrl = `${environment.identityAuthority}/Account/Register?accountType=${accountType}`;
    window.location.href = registerUrl;
  }
}
