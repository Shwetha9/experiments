import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { landingContent } from '../content/landing-content';
import { Influence } from '../models/portfolio-content';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingPage {
  private readonly theme = inject(ThemeService);
  private readonly quoteDialog = viewChild<ElementRef<HTMLDialogElement>>('quoteDialog');
  protected readonly content = landingContent;
  protected readonly isDark = this.theme.isDark;
  protected readonly selectedInfluence = signal<Influence | null>(null);

  protected toggleTheme(): void {
    this.theme.toggle();
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
