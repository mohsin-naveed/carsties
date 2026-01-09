import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bread-crumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bread-crumb.component.html',
  styleUrls: ['./bread-crumb.component.css'],
})
export class BreadCrumbComponent {
  @Input() crumbs: Array<{ label: string; url?: string }> = [];
}
