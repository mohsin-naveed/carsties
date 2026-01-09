import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { FindCar } from './find-car';

describe('FindCar', () => {
  let component: FindCar;
  let fixture: ComponentFixture<FindCar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindCar, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FindCar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
