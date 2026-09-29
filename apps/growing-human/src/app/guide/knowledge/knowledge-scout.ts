import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  KNOWLEDGE_CATEGORIES,
  KnowledgeCategory,
  KnowledgeItem,
} from '@shwetha/growing-human-contracts';
import { KnowledgeScoutClient } from '../services/knowledge.service';

@Component({
  selector: 'app-knowledge-scout',
  imports: [RouterLink],
  templateUrl: './knowledge-scout.html',
  styleUrl: './knowledge-scout.scss',
})
export class KnowledgeScout {
  readonly full = input(false);
  protected readonly client = inject(KnowledgeScoutClient);
  protected readonly categories = KNOWLEDGE_CATEGORIES;
  protected readonly revealed = signal(false);

  constructor() {
    this.client.ensureLoaded();
  }

  protected chooseCategory(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (!this.categories.some((category) => category.id === value)) return;
    this.revealed.set(false);
    this.client.scout(value as KnowledgeCategory);
  }

  protected scoutAgain(): void {
    this.revealed.set(false);
    this.client.scout(this.client.category());
  }

  protected revisit(item: KnowledgeItem): void {
    this.revealed.set(false);
    this.client.revisit(item);
  }
}
