import { Quote, QuoteApiError } from '../models/quote';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stableQuoteId(author: string, text: string): string {
  return `api-${author.toLowerCase()}-${text.slice(0, 48).toLowerCase()}`
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapQuote(value: unknown): Quote {
  if (!isRecord(value)) {
    throw new QuoteApiError('invalid', 'The quote service returned an invalid item.');
  }

  const text = value['quote'];
  const author = value['author'];
  if (
    typeof text !== 'string' ||
    text.trim() === '' ||
    typeof author !== 'string' ||
    author.trim() === ''
  ) {
    throw new QuoteApiError('invalid', 'The quote service returned incomplete quote data.');
  }

  const categories = Array.isArray(value['categories'])
    ? value['categories'].filter((category): category is string => typeof category === 'string')
    : [];
  const work = typeof value['work'] === 'string' && value['work'].trim() !== '' ? value['work'] : null;

  return {
    id: stableQuoteId(author, text),
    text,
    author,
    work,
    categories,
    source: 'api-ninjas',
  };
}

export function mapQuoteList(payload: unknown): readonly Quote[] {
  if (!Array.isArray(payload)) {
    throw new QuoteApiError('invalid', 'The quote service returned an unexpected response.');
  }

  return payload.map(mapQuote);
}

export function mapSingleQuote(payload: unknown): Quote {
  const quotes = mapQuoteList(payload);
  const firstQuote = quotes[0];
  if (!firstQuote) {
    throw new QuoteApiError('invalid', 'The quote service returned no quote.');
  }

  return firstQuote;
}
