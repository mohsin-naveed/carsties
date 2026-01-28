import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Review { name: string; rating: number; quote: string; }

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewsComponent {
  readonly reviews: Review[] = [
    { name: 'Amelia', rating: 5, quote: 'Smooth experience and great selection.' },
    { name: 'Marcus', rating: 5, quote: 'Found a bargain and seller was verified.' },
    { name: 'Priya', rating: 4, quote: 'Browsing and filters made it easy to compare.' }
  ];
}
