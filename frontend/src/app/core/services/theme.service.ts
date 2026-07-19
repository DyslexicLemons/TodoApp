import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  setTheme(themeSlug: string): void {
    document.documentElement.setAttribute('data-theme', themeSlug);
  }
}
