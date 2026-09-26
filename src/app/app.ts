import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { landingContent } from './content/landing-content';

@Component({ selector: 'app-root', imports: [], templateUrl: './app.html', styleUrl: './app.scss' })
export class App {
  private readonly document = inject(DOCUMENT);
  protected readonly content = landingContent;
  protected readonly isDark = signal(false);

  protected toggleTheme(): void {
    const isDark = !this.isDark();
    this.isDark.set(isDark);
    this.document.documentElement.dataset['theme'] = isDark ? 'dark' : 'light';
  }
}
