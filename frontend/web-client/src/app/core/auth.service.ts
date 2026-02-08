import { Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
}
