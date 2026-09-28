import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { quoteApiConfig } from './config';
import { Quote, QuoteApiError, QuoteBrowseQuery, QuoteCategory } from './quote';
import { mapQuoteList, mapSingleQuote } from './quote-api';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);

  getQuoteOfTheDay(): Observable<Quote> {
    return this.request<Quote>('quoteoftheday', mapSingleQuote);
  }

  getRandomQuote(category: QuoteCategory): Observable<Quote> {
    return this.request<Quote>('randomquotes', mapSingleQuote, { categories: category });
  }

  browseQuotes(query: QuoteBrowseQuery): Observable<readonly Quote[]> {
    const params: Record<string, string> = {};
    if (query.category) params['categories'] = query.category;

    return this.request<readonly Quote[]>('quotes', mapQuoteList, params);
  }

  getAuthors(): Observable<readonly string[]> {
    return this.request<readonly string[]>('quoteauthors', this.mapAuthors);
  }

  private request<T>(
    endpoint: string,
    mapper: (payload: unknown) => T,
    query: Record<string, string> = {},
  ): Observable<T> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      params = params.set(key, value);
    });

    return this.http
      .get<unknown>(`${quoteApiConfig.proxyUrl}/${endpoint}`, { params })
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
