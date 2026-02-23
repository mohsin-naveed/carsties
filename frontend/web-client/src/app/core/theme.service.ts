import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'carsties-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeSubject: BehaviorSubject<ThemeMode>;
  readonly isDarkMode$;
  private prefersDarkMql?: MediaQueryList;
  private hasStoredPreference = false;

  constructor() {
    const stored = (typeof window !== 'undefined')
      ? (localStorage.getItem(STORAGE_KEY) as ThemeMode | null)
      : null;

    this.hasStoredPreference = stored === 'light' || stored === 'dark';

    const initial: ThemeMode = this.hasStoredPreference
      ? (stored as ThemeMode)
      : this.getPreferredTheme();

    this.themeSubject = new BehaviorSubject<ThemeMode>(initial);
    this.isDarkMode$ = this.themeSubject.asObservable().pipe(map(mode => mode === 'dark'));
    this.applyTheme(initial);

    // If the user hasn't explicitly chosen a theme, keep tracking OS preference.
    if (typeof window !== 'undefined' && !this.hasStoredPreference) {
      this.prefersDarkMql = window.matchMedia?.('(prefers-color-scheme: dark)') ?? undefined;
      const onChange = () => {
        if (this.hasStoredPreference) return;
        this.setTheme(this.getPreferredTheme(), { persist: false });
      };

      // Modern + legacy event APIs.
      try {
        this.prefersDarkMql?.addEventListener?.('change', onChange);
      } catch {
        this.prefersDarkMql?.addListener?.(onChange as any);
      }
    }
  }

  toggleTheme(): void {
    const next: ThemeMode = this.themeSubject.value === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(mode: ThemeMode, options?: { persist?: boolean }): void {
    this.themeSubject.next(mode);

    const persist = options?.persist ?? true;
    if (typeof window !== 'undefined' && persist) {
      localStorage.setItem(STORAGE_KEY, mode);
      this.hasStoredPreference = true;
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

  private getPreferredTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'light';
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
    return prefersDark ? 'dark' : 'light';
  }
}
