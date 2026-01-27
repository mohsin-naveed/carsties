import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeroSearchComponent } from './hero-search.component';
import { ListingsCarouselComponent } from './listings-carousel.component';
import { BrowseTabsComponent } from './browse-tabs.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroSearchComponent, ListingsCarouselComponent, BrowseTabsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {}
