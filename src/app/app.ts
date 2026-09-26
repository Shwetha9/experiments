import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { landingContent } from './content/landing-content';
import { Influence } from './models/portfolio-content';

@Component({ selector: 'app-root', imports: [], templateUrl: './app.html', styleUrl: './app.scss' })
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly quoteDialog = viewChild<ElementRef<HTMLDialogElement>>('quoteDialog');
  protected readonly content = landingContent;
  protected readonly isDark = signal(false);
  protected readonly selectedInfluence = signal<Influence | null>(null);

  protected toggleTheme(): void {
    const isDark = !this.isDark();
    this.isDark.set(isDark);
    this.document.documentElement.dataset['theme'] = isDark ? 'dark' : 'light';
  }

  protected openQuote(influence: Influence): void {
    this.selectedInfluence.set(influence);
    this.quoteDialog()?.nativeElement.showModal();
  }

  protected closeQuote(): void {
    const dialog = this.quoteDialog()?.nativeElement;
    if (!dialog) return;

    dialog.close();
    this.selectedInfluence.set(null);
  }

  protected handleQuoteDialogClick(event: MouseEvent): void {
    const dialog = this.quoteDialog()?.nativeElement;
    if (!dialog || event.target !== dialog) return;

    this.closeQuote();
  }
}
