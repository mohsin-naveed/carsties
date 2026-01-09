import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { BreadCrumbComponent } from '../bread-crumb/bread-crumb.component';
import { Car } from '../../models/car.model';
import { CarService } from '../../services/car.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadCrumbComponent],
  templateUrl: './car-detail.component.html',
  styleUrls: ['./car-detail.component.css'],
})
export class CarDetailComponent {
  car: Car | null = null;
  selectedImageIndex = 0;

  constructor(private route: ActivatedRoute, private carService: CarService) {}

  ngOnInit() {
    // Get StockNumber from route param and fetch car
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carService.getCars().subscribe((cars) => {
      this.car = cars.find((c) => c.StockNumber === id) || null;
    });
  }

  selectImage(idx: number) {
    this.selectedImageIndex = idx;
  }
}
