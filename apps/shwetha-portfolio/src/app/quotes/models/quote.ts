export const quoteCategories = [
  'wisdom',
  'philosophy',
  'life',
  'leadership',
  'courage',
  'art',
  'writing',
] as const;

export type QuoteCategory = (typeof quoteCategories)[number];

export interface Quote {
  readonly id: string;
  readonly text: string;
  readonly author: string;
  readonly work: string | null;
  readonly categories: readonly string[];
  readonly source: 'api-ninjas' | 'personal';
}

export interface QuoteBrowseQuery {
  readonly category?: QuoteCategory;
  readonly limit?: number;
  readonly offset?: number;
}

export type QuoteErrorKind = 'configuration' | 'premium' | 'provider' | 'invalid';

export class QuoteApiError extends Error {
  constructor(
    readonly kind: QuoteErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'QuoteApiError';
  }
}

export type QuoteViewState = 'idle' | 'loading' | 'success' | QuoteErrorKind;
