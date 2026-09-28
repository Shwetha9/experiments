import { HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const API_NINJAS_QUOTES_URL = 'https://api.api-ninjas.com/v2';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(private readonly config: ConfigService) {}

  async get(endpoint: string, parameters: Record<string, string>): Promise<unknown> {
    // Trim: keys pasted into hosting dashboards often carry a trailing newline.
    const apiKey = this.config.get<string>('API_NINJAS_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('Quotes are not configured.');
    }

    const url = new URL(`${API_NINJAS_QUOTES_URL}/${endpoint}`);
    Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));

    try {
      const response = await fetch(url, { headers: { 'X-Api-Key': apiKey } });
      if (!response.ok) {
        const detail = (await response.text().catch(() => '')).slice(0, 200);
        this.logger.warn(`API Ninjas ${endpoint} responded ${response.status}: ${detail}`);
        throw new QuotesProviderError(response.status);
      }
      return (await response.json()) as unknown;
    } catch (error) {
      if (error instanceof QuotesProviderError) throw error;
      throw new ServiceUnavailableException('The quote service is unavailable.');
    }
  }
}

export class QuotesProviderError extends Error {
  constructor(readonly status: HttpStatus) {
    super('Quotes provider request failed.');
    this.name = 'QuotesProviderError';
  }
}
