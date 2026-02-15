import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router, RouterOutlet, RouterModule, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FooterComponent } from './shared/footer.component';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';
import { BackendHealthService } from './core/backend-health.service';
import { ListingsApiService } from './listings/listings-api.service';
import { ProfileApiService } from './profile/profile-api.service';
import { environment } from '../environments/environment.development';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet, RouterModule, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatMenuModule, MatDividerModule, MatDialogModule, MatProgressSpinnerModule, FooterComponent]
})
export class AppComponent implements OnInit {
  isAuthenticated$!: Observable<boolean>;
  isDarkMode$!: Observable<boolean>;
  authReady$!: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private health: BackendHealthService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private listingsApi: ListingsApiService,
    private profileApi: ProfileApiService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.isDarkMode$ = this.themeService.isDarkMode$;
    this.authReady$ = this.authService.authReady$;

    // Dev-quality message when UserService is down (otherwise you'd just see a noisy connection-refused stack trace).
    this.health.pingUserService();

    // After OIDC callback, ensure profile exists and is complete.
    this.authService.handleCallback();

    // After account deletion, IdentityService redirects back here.
    // Clear local auth state and land on the home page.
    this.route.queryParamMap.pipe(take(1)).subscribe(q => {
      if (q.get('accountDeleted') === '1') {
        this.authService.logoutLocal();
        this.router.navigate(['/'], { replaceUrl: true });
      }
    });
  }

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }

  register(type: 'PrivateSeller' | 'Dealer'): void {
    this.authService.register(type);
  }

  deleteAccount(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: "Delete your account? Everything will be deleted, including your listings and profile. This can't be undone."
      }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      // Best-effort cleanup of app data before removing the Identity account.
      // If any step fails, we still proceed to identity deletion.
      this.listingsApi.deleteMyListings().subscribe({
        next: () => {
          this.profileApi.deleteMe().subscribe({
            next: () => this.redirectToIdentityDeletion(),
            error: () => this.redirectToIdentityDeletion()
          });
        },
        error: () => {
          this.profileApi.deleteMe().subscribe({
            next: () => this.redirectToIdentityDeletion(),
            error: () => this.redirectToIdentityDeletion()
          });
        }
      });
    });
  }

  private redirectToIdentityDeletion(): void {
    // Clear SPA tokens so the UI immediately reflects a signed-out state.
    this.authService.logoutLocal();

    const returnUrl = encodeURIComponent(window.location.origin + '/?accountDeleted=1');
    window.location.href = `${environment.identityAuthority}/Account/Delete?returnUrl=${returnUrl}`;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
