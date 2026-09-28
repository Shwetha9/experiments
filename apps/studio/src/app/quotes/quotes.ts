import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '@studio/theme';
import { quoteAnchors } from '@studio/editorial-content';
import { localAuthors, localQuotes } from './content/local-quotes';
import { Quote, QuoteCategory, QuoteViewState, quoteCategories } from '@studio/quote-data';
import { QuoteService } from '@studio/quote-data';

@Component({
  selector: 'app-quotes',
  imports: [RouterLink],
  templateUrl: './quotes.html',
  styleUrl: './quotes.scss',
})
export class QuotesPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly quoteService = inject(QuoteService);
  private readonly theme = inject(ThemeService);
  private readonly anchorDialog = viewChild<ElementRef<HTMLDialogElement>>('anchorDialog');

  protected readonly isDark = this.theme.isDark;
  protected readonly categories = quoteCategories;
  protected readonly anchors = quoteAnchors;
  protected readonly selectedCategory = signal<QuoteCategory>('wisdom');
  protected readonly dailyQuote = signal<Quote | null>(null);
  protected readonly categoryQuote = signal<Quote | null>(null);
  protected readonly browseQuotes = signal<readonly Quote[]>([]);
  protected readonly authors = signal<readonly string[]>([]);
  protected readonly dailyState = signal<QuoteViewState>('loading');
  protected readonly categoryState = signal<QuoteViewState>('idle');
  protected readonly browseState = signal<QuoteViewState>('idle');
  protected readonly authorState = signal<QuoteViewState>('idle');
  protected readonly authorsRequested = signal(false);
  protected readonly selectedAnchor = signal<(typeof quoteAnchors)[number] | null>(null);

  constructor() {
    this.loadDailyQuote();
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }

  protected selectCategory(category: QuoteCategory): void {
    this.selectedCategory.set(category);
    this.loadCategoryQuote();
  }

  protected refreshQuote(): void {
    this.loadCategoryQuote();
  }

  protected browseCategory(): void {
    this.browseState.set('loading');
    this.browseQuotes.set([]);
    this.quoteService
      .browseQuotes({ category: this.selectedCategory(), limit: 6 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (quotes) => {
          this.browseQuotes.set(quotes);
          this.browseState.set(quotes.length > 0 ? 'success' : 'idle');
        },
        error: () => {
          this.browseQuotes.set(this.fallbackQuotes(this.selectedCategory()));
          this.browseState.set('success');
        },
      });
  }

  protected showAuthors(): void {
    if (this.authorsRequested()) return;
    this.authorsRequested.set(true);
    this.authorState.set('loading');
    this.quoteService
      .getAuthors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (authors) => {
          this.authors.set(authors);
          this.authorState.set(authors.length > 0 ? 'success' : 'idle');
        },
        error: () => {
          this.authors.set(localAuthors);
          this.authorState.set('success');
        },
      });
  }

  protected openAnchor(anchor: (typeof quoteAnchors)[number]): void {
    this.selectedAnchor.set(anchor);
    this.anchorDialog()?.nativeElement.showModal();
  }

  protected closeAnchor(): void {
    const dialog = this.anchorDialog()?.nativeElement;
    if (!dialog) return;
    dialog.close();
    this.selectedAnchor.set(null);
  }

  protected handleDialogClick(event: MouseEvent): void {
    const dialog = this.anchorDialog()?.nativeElement;
    if (!dialog || event.target !== dialog) return;
    this.closeAnchor();
  }

  protected errorMessage(state: QuoteViewState): string {
    if (state === 'configuration') {
      return 'Quotes are not connected yet. Add the API Ninjas key to enable this room.';
    }
    if (state === 'premium') {
      return 'Author browsing needs API Ninjas access that is not enabled for this key.';
    }
    if (state === 'provider') {
      return 'The quote service is taking a pause. Try again in a moment.';
    }
    return 'The quote service returned something unexpected.';
  }

  private loadDailyQuote(): void {
    this.dailyState.set('loading');
    this.quoteService
      .getQuoteOfTheDay()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (quote) => {
          this.dailyQuote.set(quote);
          this.dailyState.set('success');
        },
        error: () => {
          this.dailyQuote.set(localQuotes[0]);
          this.dailyState.set('success');
        },
      });
  }

  private loadCategoryQuote(): void {
    this.categoryState.set('loading');
    this.quoteService
      .getRandomQuote(this.selectedCategory())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (quote) => {
          this.categoryQuote.set(quote);
          this.categoryState.set('success');
        },
        error: () => {
          this.categoryQuote.set(this.fallbackQuotes(this.selectedCategory())[0]);
          this.categoryState.set('success');
        },
      });
  }

  private fallbackQuotes(category: QuoteCategory): readonly Quote[] {
    const matches = localQuotes.filter((quote) => quote.categories.includes(category));
    return matches.length > 0 ? matches : localQuotes;
  }

}
