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
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.isDarkMode$ = this.themeService.isDarkMode$;

    // After OIDC callback, ensure profile exists and is complete.
    this.authService.handleCallback();
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
