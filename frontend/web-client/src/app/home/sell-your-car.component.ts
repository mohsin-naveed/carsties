import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sell-your-car',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sell-your-car.component.html',
  styleUrls: ['./sell-your-car.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SellYourCarComponent {}
