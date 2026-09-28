import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { QuotesProviderError, QuotesService } from './quotes.service';

const QUOTE_ENDPOINTS = ['quoteoftheday', 'randomquotes', 'quotes', 'quoteauthors'] as const;
const ALLOWED_QUERY_PARAMETERS = new Set(['categories', 'limit', 'offset', 'safe']);

/**
 * Same-origin boundary for API Ninjas. This keeps the provider key in the
 * server environment instead of embedding it in the Angular bundle.
 */
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get(':endpoint')
  async get(
    @Param('endpoint') endpoint: string,
    @Query() query: Record<string, string | readonly string[] | undefined>,
  ): Promise<unknown> {
    if (!isQuoteEndpoint(endpoint)) throw new BadRequestException('Unsupported quotes endpoint.');

    // Unknown keys are dropped, not rejected: Vercel's `/api/:path*` rewrite
    // appends `path=...` to the query string in production.
    const parameters = Object.entries(query).reduce<Record<string, string>>((result, [key, value]) => {
      if (!ALLOWED_QUERY_PARAMETERS.has(key)) return result;
      if (typeof value !== 'string') {
        throw new BadRequestException('Invalid quotes query parameter.');
      }
      result[key] = value;
      return result;
    }, {});

    try {
      return await this.quotes.get(endpoint, parameters);
    } catch (error) {
      if (error instanceof QuotesProviderError) {
        // Upstream 4xx (e.g. a bad API key) is our server's fault, not the
        // browser's, so surface it as 502 rather than echoing the status.
        const status = error.status === HttpStatus.TOO_MANY_REQUESTS ? error.status : HttpStatus.BAD_GATEWAY;
        throw new HttpException('The quote service is unavailable.', status);
      }
      throw error;
    }
  }
}

const isQuoteEndpoint = (value: string): value is (typeof QUOTE_ENDPOINTS)[number] =>
  QUOTE_ENDPOINTS.some((endpoint) => endpoint === value);
