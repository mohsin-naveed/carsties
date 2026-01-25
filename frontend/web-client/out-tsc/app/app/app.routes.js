import { ListingsListComponent } from './listings/listings-list.component';
import { AddListingComponent } from './listings/add-listing.component';
import { ListingEditComponent } from './listings/listing-edit.component';
import { SearchComponent } from './search/search.component';
import { ListingDetailComponent } from './listings/listing-detail.component';
export const routes = [
    { path: '', pathMatch: 'full', redirectTo: 'listings' },
    { path: 'listings', component: ListingsListComponent },
    { path: 'listings/:id', component: ListingDetailComponent },
    { path: 'listings/:id/edit', component: ListingEditComponent },
    { path: 'sell', component: AddListingComponent },
    { path: 'search', component: SearchComponent }
];
//# sourceMappingURL=app.routes.js.map