import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '@studio/theme';
import { quoteAnchors } from '@studio/editorial-content';
import { localQuotes } from './content/local-quotes';

const SAVED_QUOTES_KEY = 'studio.quotes.saved';
import { Quote, QuoteCategory, QuoteViewState, quoteCategories } from '@studio/quote-data';
import { QuoteService } from '@studio/quote-data';

@Component({
  selector: 'app-quotes',
  imports: [RouterLink, NgTemplateOutlet],
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
  protected readonly savedQuotes = signal<readonly Quote[]>(readSavedQuotes());
  protected readonly copiedId = signal<string | null>(null);
  protected readonly announcement = signal('');
  protected readonly dailyState = signal<QuoteViewState>('loading');
  protected readonly categoryState = signal<QuoteViewState>('idle');
  protected readonly browseState = signal<QuoteViewState>('idle');
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

  protected isSaved(quote: Quote): boolean {
    return this.savedQuotes().some((saved) => saved.id === quote.id);
  }

  protected toggleSaved(quote: Quote): void {
    const wasSaved = this.isSaved(quote);
    const next = wasSaved
      ? this.savedQuotes().filter((saved) => saved.id !== quote.id)
      : [quote, ...this.savedQuotes()];
    this.savedQuotes.set(next);
    writeSavedQuotes(next);
    this.announcement.set(
      wasSaved ? `Removed quote by ${quote.author}.` : `Saved quote by ${quote.author}.`,
    );
  }

  protected async copyQuote(quote: Quote): Promise<void> {
    const text = `“${quote.text}” — ${quote.author}${quote.work ? `, ${quote.work}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      this.copiedId.set(quote.id);
      this.announcement.set(`Copied quote by ${quote.author}.`);
      setTimeout(() => {
        if (this.copiedId() === quote.id) this.copiedId.set(null);
      }, 2000);
    } catch {
      this.announcement.set('Copying is not available in this browser.');
    }
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

function readSavedQuotes(): readonly Quote[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SAVED_QUOTES_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as Quote[]) : [];
  } catch {
    return [];
  }
}

function writeSavedQuotes(quotes: readonly Quote[]): void {
  try {
    localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(quotes));
  } catch {
    // Storage full or blocked: the shelf still works for this visit.
  }
}
