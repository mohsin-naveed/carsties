import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeroSearchComponent } from './hero-search.component';
import { BrowseTabsComponent } from './browse-tabs.component';
import { FeaturedListingsComponent } from './featured-listings.component';
import { SellYourCarComponent } from './sell-your-car.component';
import { RevealOnScrollDirective } from '../shared/reveal-on-scroll.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    HeroSearchComponent,
    BrowseTabsComponent,
    FeaturedListingsComponent,
    SellYourCarComponent,

    // UI-only micro-interaction
    RevealOnScrollDirective,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {}
