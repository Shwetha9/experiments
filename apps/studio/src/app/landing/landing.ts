import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { landingContent } from '@studio/editorial-content';
import { Influence } from '@studio/editorial-content';
import { ThemeService } from '@studio/theme';

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
  protected readonly heroImageReady = signal(false);
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }

  protected markHeroImageReady(): void {
    this.heroImageReady.set(true);
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
