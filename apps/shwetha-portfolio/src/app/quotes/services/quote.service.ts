import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { quoteApiConfig } from '../config';
import { localAuthors, localQuotes } from '../content/local-quotes';
import { Quote, QuoteApiError, QuoteBrowseQuery, QuoteCategory } from '../models/quote';
import { mapQuoteList, mapSingleQuote } from '../utils/quote-api';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);

  getQuoteOfTheDay(): Observable<Quote> {
    if (!quoteApiConfig.apiKey) return of(this.localQuoteOfTheDay());
    return this.request<Quote>('quoteoftheday', mapSingleQuote);
  }

  getRandomQuote(category: QuoteCategory): Observable<Quote> {
    if (!quoteApiConfig.apiKey) {
      return of(this.localQuotesFor(category)[0] ?? localQuotes[0]);
    }
    return this.request<Quote>('randomquotes', mapSingleQuote, { categories: category, safe: 'true' });
  }

  browseQuotes(query: QuoteBrowseQuery): Observable<readonly Quote[]> {
    if (!quoteApiConfig.apiKey) {
      const offset = query.offset ?? 0;
      const limit = query.limit ?? localQuotes.length;
      return of(this.localQuotesFor(query.category).slice(offset, offset + limit));
    }
    const params: Record<string, string> = { safe: 'true' };
    if (query.category) params['categories'] = query.category;
    if (query.limit !== undefined) params['limit'] = `${query.limit}`;
    if (query.offset !== undefined) params['offset'] = `${query.offset}`;

    return this.request<readonly Quote[]>('quotes', mapQuoteList, params);
  }

  getAuthors(): Observable<readonly string[]> {
    if (!quoteApiConfig.apiKey) return of(localAuthors);
    return this.request<readonly string[]>('quoteauthors', this.mapAuthors);
  }

  private localQuoteOfTheDay(): Quote {
    const day = Math.floor(Date.now() / 86_400_000);
    return localQuotes[day % localQuotes.length];
  }

  private localQuotesFor(category?: QuoteCategory): readonly Quote[] {
    if (!category) return localQuotes;
    const matches = localQuotes.filter((quote) => quote.categories.includes(category));
    return matches.length > 0 ? matches : localQuotes;
  }

  private request<T>(
    endpoint: string,
    mapper: (payload: unknown) => T,
    query: Record<string, string> = {},
  ): Observable<T> {
    if (!quoteApiConfig.apiKey) {
      return throwError(() => new QuoteApiError('configuration', 'Add an API Ninjas key to connect quotes.'));
    }

    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      params = params.set(key, value);
    });

    return this.http
      .get<unknown>(`${quoteApiConfig.baseUrl}/${endpoint}`, {
        headers: new HttpHeaders({ 'X-Api-Key': quoteApiConfig.apiKey }),
        params,
      })
      .pipe(
        map(mapper),
        catchError((error: unknown) => throwError(() => this.toQuoteError(error))),
      );
  }

  private readonly mapAuthors = (payload: unknown): readonly string[] => {
    if (!Array.isArray(payload) || payload.some((author) => typeof author !== 'string')) {
      throw new QuoteApiError('invalid', 'The author service returned an unexpected response.');
    }

    return payload;
  };

  private toQuoteError(error: unknown): QuoteApiError {
    if (error instanceof QuoteApiError) return error;
    if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
      return new QuoteApiError('premium', 'Author browsing is not available for this API plan.');
    }
    return new QuoteApiError('provider', 'The quote service is taking a pause.');
  }
}
