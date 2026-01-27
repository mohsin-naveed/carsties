import { Routes } from '@angular/router';
import { ListingsListComponent } from './listings/listings-list.component';
import { AddListingComponent } from './listings/add-listing.component';
import { ListingEditComponent } from './listings/listing-edit.component';
import { SearchComponent } from './search/search.component';
import { ListingDetailComponent } from './listings/listing-detail.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'listings', component: ListingsListComponent },
  { path: 'listings/:id', component: ListingDetailComponent },
  { path: 'listings/:id/edit', component: ListingEditComponent },
  { path: 'sell', component: AddListingComponent },
  { path: 'search', component: SearchComponent }
];
