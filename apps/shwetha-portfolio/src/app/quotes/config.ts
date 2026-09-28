export interface QuoteApiConfig {
  readonly proxyUrl: string;
}

export const quoteApiConfig: QuoteApiConfig = {
  proxyUrl: '/api/quotes',
};
