import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap, timeout } from 'rxjs';

export const NASA_EPIC_ENDPOINT = 'https://epic.gsfc.nasa.gov/api/natural';
const NASA_EPIC_SITE = 'https://epic.gsfc.nasa.gov';

export interface EarthImage {
  readonly date: string;
  readonly imageUrl: string;
  readonly sourceUrl: string;
}

@Injectable({ providedIn: 'root' })
export class EarthImageClient {
  private readonly http = inject(HttpClient);
  private cached: EarthImage | null = null;

  latest(): Observable<EarthImage | null> {
    if (this.cached) return of(this.cached);
    return this.http.get<unknown>(NASA_EPIC_ENDPOINT).pipe(
      timeout({ first: 8000 }),
      map(toEarthImage),
      tap((image) => { if (image) this.cached = image; }),
      catchError(() => of(null)),
    );
  }
}

const toEarthImage = (payload: unknown): EarthImage | null => {
  if (!Array.isArray(payload)) return null;
  const item = payload.at(-1) as unknown;
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  if (typeof record['image'] !== 'string' || !/^epic_1b_\d{14}$/.test(record['image'])) {
    return null;
  }
  if (typeof record['date'] !== 'string') return null;
  const date = record['date'].slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const [year, month, day] = date.split('-');
  return {
    date,
    imageUrl: `${NASA_EPIC_SITE}/archive/natural/${year}/${month}/${day}/jpg/${record['image']}.jpg`,
    sourceUrl: `${NASA_EPIC_SITE}/?date=${date}`,
  };
};
