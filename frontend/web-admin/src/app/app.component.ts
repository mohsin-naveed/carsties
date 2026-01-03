import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <span>{{ title() }}</span>
      <span class="spacer"></span>
  <button mat-button routerLink="/catalog/makes" routerLinkActive="active">Makes</button>
  <button mat-button routerLink="/catalog/models" routerLinkActive="active">Models</button>
  <button mat-button routerLink="/catalog/generations" routerLinkActive="active">Generations</button>
  <button mat-button routerLink="/catalog/derivatives" routerLinkActive="active">Derivatives</button>
  <button mat-button routerLink="/catalog/variants" routerLinkActive="active">Variants</button>
  <button mat-button routerLink="/catalog/features" routerLinkActive="active">Features</button>
  
    </mat-toolbar>
    <main class="app-main">
      <router-outlet />
    </main>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly title = signal('Carsties Admin');
}
