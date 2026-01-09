import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Car } from '../../models/car.model';

@Component({
  selector: 'app-car-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './car-card.component.html',
  styleUrls: ['./car-card.component.css'],
})
export class CarCardComponent {
  @Input() car!: Car;

  currentImageIndex = 0;
  isImageLoading = true;

  get displayImages(): string[] {
    if (this.car.SliderImages && this.car.SliderImages.length > 0) {
      return this.car.SliderImages.map((img) => img.ClearImage);
    }
    if (this.car.MainThumbnailImage) {
      return [this.car.MainThumbnailImage];
    }
    if (this.car.WebsiteImageLinks && this.car.WebsiteImageLinks.length > 0) {
      return this.car.WebsiteImageLinks.slice(0, 5); // Limit to 5 images for performance
    }
    return [];
  }

  nextImage() {
    if (this.displayImages.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.displayImages.length;
    }
  }

  previousImage() {
    if (this.displayImages.length > 1) {
      this.currentImageIndex =
        this.currentImageIndex === 0 ? this.displayImages.length - 1 : this.currentImageIndex - 1;
    }
  }

  goToImage(index: number) {
    this.currentImageIndex = index;
  }

  onImageLoad() {
    this.isImageLoading = false;
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/placeholder-car.jpg'; // Fallback image
    this.isImageLoading = false;
  }

  formatPrice(price: number): string {
    return '£' + price.toLocaleString();
  }

  formatMileage(mileage: number): string {
    return mileage.toLocaleString() + ' miles';
  }

  getTransmissionDisplay(transmission: string): string {
    return transmission || 'Not specified';
  }

  getFuelDisplay(fuel: string): string {
    return fuel || 'Not specified';
  }
}
