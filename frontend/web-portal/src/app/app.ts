import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopNavComponent } from './components/top-nav/top-nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNavComponent],
  template: `
    <div class="app-container">
      <app-top-nav></app-top-nav>
      <!-- Removed Car Finder header and description -->
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrl: './app.css',
})
export class App {
  title = 'Find Car App';
}
