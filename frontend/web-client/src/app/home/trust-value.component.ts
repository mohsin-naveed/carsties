import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trust-value',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trust-value.component.html',
  styleUrls: ['./trust-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustValueComponent {}
