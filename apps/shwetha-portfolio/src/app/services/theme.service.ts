import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly isDark = signal(this.initialThemeIsDark());

  constructor() {
    this.applyTheme(this.isDark());
  }

  toggle(): void {
    const nextThemeIsDark = !this.isDark();
    this.isDark.set(nextThemeIsDark);
    this.applyTheme(nextThemeIsDark);
  }

  private initialThemeIsDark(): boolean {
    const explicitTheme = this.document.documentElement.dataset['theme'];
    if (explicitTheme === 'dark') return true;
    if (explicitTheme === 'light') return false;
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
  }

  private applyTheme(isDark: boolean): void {
    this.document.documentElement.dataset['theme'] = isDark ? 'dark' : 'light';
  }
}
