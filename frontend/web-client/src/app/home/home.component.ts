import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSearchComponent } from './hero-search.component';
import { ListingsCarouselComponent } from './listings-carousel.component';
import { BrowseTabsComponent } from './browse-tabs.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroSearchComponent, ListingsCarouselComponent, BrowseTabsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {}
