import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  KNOWLEDGE_ENDPOINT,
  KnowledgeCategory,
  KnowledgeItem,
  REVIEWED_KNOWLEDGE,
  REVIEWED_KNOWLEDGE_DECKS,
} from '@shwetha/growing-human-contracts';
import { Subscription, catchError, of, timeout } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class KnowledgeScoutClient {
  private readonly http = inject(HttpClient);
  private pending: Subscription | null = null;
  private hasLoaded = false;
  private readonly reviewedPositions = new Map<KnowledgeCategory, number>();
  private readonly reviewedSeen = new Map<KnowledgeCategory, Set<string>>();

  readonly category = signal<KnowledgeCategory>('surprise');
  readonly item = signal<KnowledgeItem>(REVIEWED_KNOWLEDGE.surprise);
  readonly loading = signal(false);
  readonly exhausted = signal(false);
  readonly trail = signal<readonly KnowledgeItem[]>([]);
  readonly saved = signal<readonly KnowledgeItem[]>([]);

  ensureLoaded(): void {
    if (!this.hasLoaded) this.scout(this.category());
  }

  scout(category: KnowledgeCategory): void {
    this.hasLoaded = true;
    this.pending?.unsubscribe();
    this.category.set(category);
    const reviewed = this.nextReviewed(category);
    this.item.set(reviewed);
    this.loading.set(true);
    this.exhausted.set(false);
    this.pending = this.http
      .get<KnowledgeItem>(`${KNOWLEDGE_ENDPOINT}?category=${category}`)
      .pipe(
        timeout({ first: 8000 }),
        catchError(() => of(reviewed)),
      )
      .subscribe((item) => {
        const next = validItem(item, category) && item.source === 'api-ninjas' ? item : reviewed;
        this.item.set(next);
        if (next.source === 'reviewed') {
          const seen = this.reviewedSeen.get(category) ?? new Set<string>();
          seen.add(next.text);
          this.reviewedSeen.set(category, seen);
          this.exhausted.set(seen.size >= REVIEWED_KNOWLEDGE_DECKS[category].length);
        }
        this.trail.update((items) =>
          [next, ...items.filter((entry) => entry.text !== next.text)].slice(0, 6),
        );
        this.loading.set(false);
      });
  }

  revisit(item: KnowledgeItem): void {
    this.pending?.unsubscribe();
    this.category.set(item.category);
    this.item.set(item);
    this.loading.set(false);
    this.exhausted.set(
      item.source === 'reviewed' &&
        this.reviewedSeen.get(item.category)?.size ===
          REVIEWED_KNOWLEDGE_DECKS[item.category].length,
    );
  }

  isSaved(item: KnowledgeItem): boolean {
    return this.saved().some((entry) => sameItem(entry, item));
  }

  toggleSaved(item: KnowledgeItem): void {
    this.saved.update((items) =>
      items.some((entry) => sameItem(entry, item))
        ? items.filter((entry) => !sameItem(entry, item))
        : [item, ...items],
    );
  }

  reset(): void {
    this.pending?.unsubscribe();
    this.hasLoaded = false;
    this.reviewedPositions.clear();
    this.reviewedSeen.clear();
    this.category.set('surprise');
    this.item.set(REVIEWED_KNOWLEDGE.surprise);
    this.trail.set([]);
    this.saved.set([]);
    this.loading.set(false);
    this.exhausted.set(false);
  }

  private nextReviewed(category: KnowledgeCategory): KnowledgeItem {
    const deck = REVIEWED_KNOWLEDGE_DECKS[category];
    const next = ((this.reviewedPositions.get(category) ?? -1) + 1) % deck.length;
    this.reviewedPositions.set(category, next);
    return deck[next];
  }
}

const validItem = (item: KnowledgeItem, category: KnowledgeCategory): boolean =>
  !!item &&
  item.category === category &&
  (item.kind === 'fact' || item.kind === 'question') &&
  typeof item.text === 'string' &&
  item.text.length <= 240 &&
  (item.kind === 'fact' || typeof item.answer === 'string');

const sameItem = (first: KnowledgeItem, second: KnowledgeItem): boolean =>
  first.category === second.category && first.text === second.text;
