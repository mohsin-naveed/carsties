import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dealer-promo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dealer-promo.component.html',
  styleUrls: ['./dealer-promo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DealerPromoComponent {}
