import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CarService } from '../services/car.service';
import { Car } from '../models/car.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  cars: Car[] = [];
  makes: string[] = [];
  models: string[] = [];
  selectedMake: string = '';
  selectedModel: string = '';
  filteredCars: Car[] = [];

  constructor(private carService: CarService, private router: Router) {}

  ngOnInit() {
    this.carService.getCars().subscribe((cars: Car[]) => {
      this.cars = cars;
      this.makes = Array.from(new Set(cars.map((car: Car) => car.Make)));
      this.updateModels();
      this.updateFilteredCars();
    });
  }

  updateModels() {
    if (this.selectedMake) {
      this.models = Array.from(
        new Set(this.cars.filter((car) => car.Make === this.selectedMake).map((car) => car.Model))
      );
    } else {
      this.models = [];
    }
    this.selectedModel = '';
  }

  onMakeChange() {
    this.updateModels();
    this.updateFilteredCars();
  }

  onModelChange() {
    this.updateFilteredCars();
  }

  updateFilteredCars() {
    this.filteredCars = this.cars.filter((car) => {
      const matchMake = this.selectedMake ? car.Make === this.selectedMake : true;
      const matchModel = this.selectedModel ? car.Model === this.selectedModel : true;
      return matchMake && matchModel;
    });
  }

  searchCars() {
    // Build query params for selected filters
    const queryParams: any = {};
    if (this.selectedMake) queryParams.make = this.selectedMake;
    if (this.selectedModel) queryParams.model = this.selectedModel;
    this.router.navigate(['/find-cars'], { queryParams });
  }
}
