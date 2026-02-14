import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { RouterOutlet, RouterModule, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { FooterComponent } from './shared/footer.component';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';
import { ProfileApiService } from './profile/profile-api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet, RouterModule, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatMenuModule, MatDividerModule, FooterComponent]
})
export class AppComponent implements OnInit {
  isAuthenticated$!: Observable<boolean>;
  isDarkMode$!: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private profilesApi: ProfileApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.isDarkMode$ = this.themeService.isDarkMode$;

    // After OIDC callback, ensure profile exists and is complete.
    this.authService.handleCallback();
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (!isAuth) return;

      // Avoid redirect loops if we're already on the completion page.
      if (this.router.url.startsWith('/complete-profile')) return;

      this.profilesApi.getMe().subscribe({
        next: me => {
          if (!me.isProfileComplete) {
            const desired = this.authService.consumeDesiredUserType();
            const query: any = { returnUrl: this.router.url };
            if (desired) query.type = desired;
            this.router.navigate(['/complete-profile'], { queryParams: query });
          }
        },
        error: () => {
          // No profile yet (404) -> go complete it
          const desired = this.authService.consumeDesiredUserType();
          const query: any = { returnUrl: this.router.url };
          if (desired) query.type = desired;
          this.router.navigate(['/complete-profile'], { queryParams: query });
        }
      });
    });
  }

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }

  register(type: 'Individual' | 'Dealer'): void {
    this.authService.register(type);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
