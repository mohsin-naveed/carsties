import { Component } from '@angular/core';
import { AddListingComponent } from './listings/add-listing.component';
import { ListingsListComponent } from './listings/listings-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [AddListingComponent, ListingsListComponent]
})
export class AppComponent { }
