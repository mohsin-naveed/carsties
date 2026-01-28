import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeroSearchComponent } from './hero-search.component';
import { BrowseTabsComponent } from './browse-tabs.component';
import { FeaturedListingsComponent } from './featured-listings.component';
import { SellYourCarComponent } from './sell-your-car.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroSearchComponent,
    BrowseTabsComponent,
    FeaturedListingsComponent,
    SellYourCarComponent,
    
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {}
