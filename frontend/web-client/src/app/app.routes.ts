import { Routes } from '@angular/router';
import { ListingsListComponent } from './listings/listings-list.component';
import { AddListingComponent } from './listings/add-listing.component';
import { ListingEditComponent } from './listings/listing-edit.component';
import { SearchComponent } from './search/search.component';
import { ListingDetailComponent } from './listings/listing-detail.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './core/auth.guard';
import { MyListingsComponent } from './listings/my-listings.component';
import { CompleteProfileComponent } from './profile/complete-profile.component';
import { profileCompleteGuard } from './core/profile-complete.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [profileCompleteGuard] },
  { path: 'complete-profile', component: CompleteProfileComponent, canActivate: [authGuard] },
  { path: 'listings', component: ListingsListComponent, canActivate: [profileCompleteGuard] },
  { path: 'listings/:id', component: ListingDetailComponent, canActivate: [profileCompleteGuard] },
  { path: 'listings/:id/edit', component: ListingEditComponent, canActivate: [authGuard, profileCompleteGuard] },
  { path: 'my-listings', component: MyListingsComponent, canActivate: [authGuard, profileCompleteGuard] },
  { path: 'sell', component: AddListingComponent, canActivate: [authGuard, profileCompleteGuard] },
  { path: 'search', component: SearchComponent, canActivate: [profileCompleteGuard] }
];
