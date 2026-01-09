import { Routes } from '@angular/router';
import { ListingsListComponent } from './listings/listings-list.component';
import { AddListingComponent } from './listings/add-listing.component';
import { ListingEditComponent } from './listings/listing-edit.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'listings' },
  { path: 'listings', component: ListingsListComponent },
  { path: 'listings/:id/edit', component: ListingEditComponent },
  { path: 'sell', component: AddListingComponent }
];
