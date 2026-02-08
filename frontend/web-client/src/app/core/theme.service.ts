import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'carsties-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeSubject: BehaviorSubject<ThemeMode>;
  readonly isDarkMode$;

  constructor() {
    const stored = (typeof window !== 'undefined') ? (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) : null;
    const initial: ThemeMode = stored === 'dark' ? 'dark' : 'light';
    this.themeSubject = new BehaviorSubject<ThemeMode>(initial);
    this.isDarkMode$ = this.themeSubject.asObservable().pipe(map(mode => mode === 'dark'));
    this.applyTheme(initial);
  }

  toggleTheme(): void {
    const next: ThemeMode = this.themeSubject.value === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(mode: ThemeMode): void {
    this.themeSubject.next(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
    this.applyTheme(mode);
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (mode === 'dark') {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }
}
