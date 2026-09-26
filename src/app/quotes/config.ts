export interface QuoteApiConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
}

export const quoteApiConfig: QuoteApiConfig = {
  baseUrl: 'https://api.api-ninjas.com/v2',
  apiKey: '',
};
