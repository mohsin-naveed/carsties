// ...existing code...
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
    pathMatch: 'full',
  },
  {
    path: 'find-cars',
    loadComponent: () =>
      import('./components/find-car/find-car.component').then((m) => m.FindCarComponent),
  },
  {
    path: 'car/:id',
    loadComponent: () =>
      import('./components/car-detail/car-detail.component').then((m) => m.CarDetailComponent),
  },
  { path: '**', redirectTo: '' },
];
