import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'darkMode';

@Injectable({ providedIn: 'root' })
export class DarkModeService {
  readonly isDark = signal(this.readInitial());

  constructor() {
    this.apply(this.isDark());
  }

  toggle(): void {
    this.set(!this.isDark());
  }

  set(value: boolean): void {
    this.isDark.set(value);
    this.apply(value);
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  }

  private apply(value: boolean): void {
    document.documentElement.classList.toggle('dark-mode', value);
  }

  private readInitial(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
