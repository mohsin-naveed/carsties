import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface QuickCard {
  title: string;
  subtitle?: string;
  icon?: string;
  query: Record<string, any>;
}

@Component({
  selector: 'app-quick-browse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-browse.component.html',
  styleUrls: ['./quick-browse.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickBrowseComponent {
  private readonly router = inject(Router);

  readonly cards: QuickCard[] = [
    { title: 'Cars under £5,000', subtitle: 'Great value picks', icon: 'local_offer', query: { pmax: 5000 } },
    { title: 'Automatic cars', subtitle: 'Easy to drive', icon: 'settings', query: { trans: 'Automatic' } },
    { title: 'Electric cars', subtitle: 'Zero emissions', icon: 'bolt', query: { fuel: 'Electric' } },
    { title: 'SUVs', subtitle: 'Space for everyone', icon: 'airport_shuttle', query: { body: 'SUV' } },
    { title: 'Low mileage', subtitle: '< 30k miles', icon: 'speed', query: { mmax: 30000 } }
  ];

  go(card: QuickCard) {
    this.router.navigate(['/search'], { queryParams: card.query });
  }
}
