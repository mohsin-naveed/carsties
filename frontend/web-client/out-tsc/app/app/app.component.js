var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from '@angular/core';
import { AddListingComponent } from './listings/add-listing.component';
import { ListingsListComponent } from './listings/listings-list.component';
import { RouterOutlet, RouterModule, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
let AppComponent = class AppComponent {
};
AppComponent = __decorate([
    Component({
        selector: 'app-root',
        standalone: true,
        templateUrl: './app.component.html',
        styleUrls: ['./app.component.scss'],
        imports: [RouterOutlet, RouterModule, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, MatSnackBarModule, AddListingComponent, ListingsListComponent]
    })
], AppComponent);
export { AppComponent };
//# sourceMappingURL=app.component.js.map