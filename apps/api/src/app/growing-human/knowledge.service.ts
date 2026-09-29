import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KNOWLEDGE_CATEGORIES,
  KnowledgeCategory,
  KnowledgeItem,
  REVIEWED_KNOWLEDGE,
} from '@shwetha/growing-human-contracts';

const API_NINJAS_BASE = 'https://api.api-ninjas.com/v1';
const UNSUITABLE = /\b(?:sex|sexual|murder|suicide|weapon|drug|alcohol|slur|corpse|torture)\b/i;

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(private readonly config: ConfigService) {}

  async scout(category: KnowledgeCategory): Promise<KnowledgeItem> {
    const fallback = REVIEWED_KNOWLEDGE[category];
    const key = this.config.get<string>('API_NINJAS_API_KEY')?.trim();
    if (!key) return fallback;

    const selected = KNOWLEDGE_CATEGORIES.find((item) => item.id === category)!;
    const url = new URL(`${API_NINJAS_BASE}/${selected.apiCategory ? 'trivia' : 'facts'}`);
    url.searchParams.set('safe', 'true');
    if (selected.apiCategory) url.searchParams.set('category', selected.apiCategory);

    try {
      const response = await fetch(url, {
        headers: { 'X-Api-Key': key },
        signal: AbortSignal.timeout(5000),
      });
      // Both category and safe filtering are premium features. Keep the
      // reviewed fallback when this key cannot use them.
      if (!response.ok) return fallback;
      const payload = (await response.json()) as unknown;
      if (!Array.isArray(payload) || !payload[0] || typeof payload[0] !== 'object') return fallback;
      const result = payload[0] as Record<string, unknown>;

      if (!selected.apiCategory && isSuitable(result['fact'])) {
        return { category, kind: 'fact', text: result['fact'], source: 'api-ninjas' };
      }
      if (selected.apiCategory && isSuitable(result['question']) && isSuitable(result['answer'])) {
        return {
          category,
          kind: 'question',
          text: result['question'],
          answer: result['answer'],
          source: 'api-ninjas',
        };
      }
    } catch {
      this.logger.warn('Knowledge scouting is unavailable; using reviewed content.');
    }
    return fallback;
  }
}

const isSuitable = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 3 && value.length <= 240 && !UNSUITABLE.test(value);
