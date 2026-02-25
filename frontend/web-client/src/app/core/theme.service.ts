import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'carsties-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeSubject: BehaviorSubject<ThemeMode>;
  readonly isDarkMode$;
  private hasStoredPreference = false;

  constructor() {
    const initial: ThemeMode = 'light';

    this.themeSubject = new BehaviorSubject<ThemeMode>(initial);
    this.isDarkMode$ = this.themeSubject.asObservable().pipe(map(mode => mode === 'dark'));
    this.applyTheme(initial);

    // Ensure any previously stored preference can't re-enable dark mode.
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  toggleTheme(): void {
    // Theme toggle disabled: always stay in light mode.
    this.setTheme('light', { persist: false });
  }

  setTheme(mode: ThemeMode, options?: { persist?: boolean }): void {
    // Force light theme even if callers request dark.
    const enforced: ThemeMode = 'light';
    this.themeSubject.next(enforced);

    const persist = options?.persist ?? true;
    if (typeof window !== 'undefined' && persist) {
      localStorage.setItem(STORAGE_KEY, enforced);
      this.hasStoredPreference = true;
    }

    this.applyTheme(enforced);
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.classList.remove('dark-theme');
  }
}
