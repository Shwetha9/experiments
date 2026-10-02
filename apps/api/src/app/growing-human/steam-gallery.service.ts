import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { STEAM_THEMES, SteamGallery, SteamImage, SteamTheme } from '@shwetha/growing-human-contracts';

interface NasaItem {
  readonly data?: readonly { readonly nasa_id?: unknown; readonly title?: unknown; readonly date_created?: unknown }[];
  readonly links?: readonly { readonly href?: unknown; readonly render?: unknown }[];
}

/** Fetches only curated NASA Image Library searches. No child search text reaches NASA. */
@Injectable()
export class SteamGalleryService {
  private readonly cache = new Map<string, { readonly until: number; readonly gallery: SteamGallery }>();

  async get(theme: SteamTheme, page: number): Promise<SteamGallery> {
    const topic = STEAM_THEMES.find((item) => item.id === theme);
    if (!topic || !Number.isInteger(page) || page < 1 || page > 10) {
      throw new BadRequestException('Choose a supported NASA topic and page.');
    }
    const key = `${theme}:${page}`;
    const cached = this.cache.get(key);
    if (cached && cached.until > Date.now()) return cached.gallery;

    const url = new URL('https://images-api.nasa.gov/search');
    url.searchParams.set('q', topic.query);
    url.searchParams.set('media_type', 'image');
    url.searchParams.set('page_size', '24');
    url.searchParams.set('page', String(page));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('NASA unavailable');
      const payload = await response.json() as { collection?: { items?: readonly NasaItem[] } };
      const images = (payload.collection?.items ?? [])
        .map(toImage)
        .filter((item): item is SteamImage => item !== null)
        .slice(0, 12);
      if (!images.length) throw new Error('No usable NASA images');
      const gallery: SteamGallery = { theme, page, images };
      this.cache.set(key, { until: Date.now() + 15 * 60_000, gallery });
      return gallery;
    } catch {
      throw new ServiceUnavailableException('NASA images are unavailable right now. Try again soon.');
    } finally {
      clearTimeout(timer);
    }
  }
}

const toImage = (item: NasaItem): SteamImage | null => {
  const data = item.data?.[0];
  const link = item.links?.find((entry) => entry.render === 'image');
  const id = data?.nasa_id;
  const title = data?.title;
  const href = link?.href;
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{3,80}$/.test(id) ||
      typeof title !== 'string' || typeof href !== 'string') return null;
  let imageUrl: URL;
  try { imageUrl = new URL(href); } catch { return null; }
  if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'images-assets.nasa.gov') return null;
  const cleanTitle = title.replace(/[\r\n<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
  if (cleanTitle.length < 4 || /\b(death|weapon|war|fatal|disaster)\b/i.test(cleanTitle)) return null;
  const rawDate = data?.date_created;
  const date = typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)
    ? rawDate.slice(0, 10) : null;
  return {
    id,
    title: cleanTitle,
    thumbnailUrl: imageUrl.toString(),
    sourceUrl: `https://images.nasa.gov/details/${encodeURIComponent(id)}`,
    date,
  };
};
