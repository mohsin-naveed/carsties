import { Component } from '@angular/core';
import { AddListingComponent } from './listings/add-listing.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [AddListingComponent]
})
export class AppComponent { }
