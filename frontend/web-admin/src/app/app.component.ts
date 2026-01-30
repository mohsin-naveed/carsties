import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatMenuModule],
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
  <button mat-button [matMenuTriggerFor]="locationMenu" #trigger="matMenuTrigger" (mouseenter)="trigger.openMenu()">Location</button>
  <mat-menu #locationMenu="matMenu">
    <button mat-menu-item routerLink="/location/provinces" routerLinkActive="active">Provinces</button>
    <button mat-menu-item routerLink="/location/cities" routerLinkActive="active">Cities</button>
    <button mat-menu-item routerLink="/location/areas" routerLinkActive="active">Areas</button>
  </mat-menu>
  
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
