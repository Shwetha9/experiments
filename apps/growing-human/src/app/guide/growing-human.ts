import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { growingHumanContent } from './content/growing-human-content';
import { spaceDiscoveries } from './content/space-discoveries';
import { AgeBand, ChatMessage, ChatReply, TopicLaneId } from './models/growing-human';
import { GrowingHumanChatService } from './services/growing-human-chat.service';
import { EarthImagePanel } from './earth-image/earth-image';
import { KnowledgeScout } from './knowledge/knowledge-scout';
import { GrowingHumanJourney } from './services/journey.service';
import { KnowledgeScoutClient } from './services/knowledge.service';

type Step = 'age' | 'lane' | 'chat' | 'discover';

interface ThreadEntry {
  readonly message: ChatMessage;
  readonly action?: string;
}

@Component({
  selector: 'app-growing-human',
  imports: [RouterLink, EarthImagePanel, KnowledgeScout],
  templateUrl: './growing-human.html',
  styleUrl: './growing-human.scss',
})
export class GrowingHumanPage {
  private readonly chat = inject(GrowingHumanChatService);
  private readonly journey = inject(GrowingHumanJourney);
  private readonly knowledge = inject(KnowledgeScoutClient);
  private readonly injector = inject(Injector);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');
  private readonly factTitle = viewChild<ElementRef<HTMLElement>>('factTitle');
  private readonly composer = viewChild<ElementRef<HTMLTextAreaElement>>('composer');
  private pending: Subscription | null = null;

  protected readonly content = growingHumanContent;
  protected readonly discoveries = spaceDiscoveries;
  protected readonly ageBand = this.journey.ageBand;
  protected readonly activity = this.journey.activity;
  protected readonly discoveryIndex = signal(0);
  protected readonly chosenAnswer = signal<number | null>(null);
  protected readonly laneId = signal<TopicLaneId>('anything');
  protected readonly thread = signal<readonly ThreadEntry[]>([]);
  protected readonly draft = signal('');
  protected readonly isThinking = signal(false);

  protected readonly step = computed<Step>(() => {
    if (!this.ageBand()) return 'age';
    if (this.activity() === 'discover') return 'discover';
    return this.thread().length === 0 ? 'lane' : 'chat';
  });
  protected readonly discovery = computed(() => this.discoveries[this.discoveryIndex()]);
  protected readonly ageLabel = computed(
    () => this.content.ageStep.options.find((option) => option.id === this.ageBand())?.label ?? '',
  );
  protected readonly lane = computed(
    () => this.content.laneStep.lanes.find((lane) => lane.id === this.laneId()) ?? null,
  );
  protected readonly canSend = computed(() => this.draft().trim().length > 0 && !this.isThinking());

  constructor() {
    inject(DestroyRef).onDestroy(() => this.pending?.unsubscribe());
  }

  protected selectAge(ageBand: AgeBand): void {
    this.ageBand.set(ageBand);
    this.focusAfterRender(() => this.stepHeading()?.nativeElement);
  }

  protected chooseActivity(activity: 'guide' | 'discover'): void {
    this.activity.set(activity);
    this.focusAfterRender(() => this.stepHeading()?.nativeElement);
  }

  protected chooseAnswer(index: number): void {
    if (this.chosenAnswer() !== null) return;
    this.chosenAnswer.set(index);
  }

  protected shuffleDiscovery(): void {
    const current = this.discoveryIndex();
    const otherCount = this.discoveries.length - 1;
    if (otherCount < 1) return;
    const pick = Math.floor(Math.random() * otherCount);
    this.discoveryIndex.set(pick >= current ? pick + 1 : pick);
    this.chosenAnswer.set(null);
    this.focusAfterRender(() => this.factTitle()?.nativeElement);
  }

  protected selectLane(laneId: TopicLaneId): void {
    if (laneId !== this.laneId()) {
      // A new topic starts a fresh conversation: drop the stale thread (and any
      // in-flight reply) so the new lane's starter questions are shown.
      this.cancelPending();
      this.thread.set([]);
      this.draft.set('');
    }
    this.laneId.set(laneId);
    this.focusAfterRender(() => this.composer()?.nativeElement);
  }

  protected useStarter(starter: string): void {
    this.draft.set(starter);
    this.focusAfterRender(() => this.composer()?.nativeElement);
  }

  protected updateDraft(event: Event): void {
    if (!(event.target instanceof HTMLTextAreaElement)) return;
    this.draft.set(event.target.value);
  }

  protected handleComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    this.send();
  }

  protected send(event?: SubmitEvent): void {
    event?.preventDefault();
    const ageBand = this.ageBand();
    const text = this.draft().trim().slice(0, this.content.limits.maxMessageLength);
    if (!ageBand || !text || this.isThinking()) return;

    this.thread.update((thread) => [...thread, { message: { role: 'child', text } }]);
    this.draft.set('');
    this.isThinking.set(true);

    const messages = this.thread()
      .map((entry) => entry.message)
      .slice(-this.content.limits.maxContextMessages);

    this.pending = this.chat
      .reply({ ageBand, lane: this.laneId(), messages })
      .subscribe((reply) => this.receive(reply));
  }

  protected startOver(): void {
    this.cancelPending();
    this.knowledge.reset();
    this.ageBand.set(null);
    this.activity.set('guide');
    this.discoveryIndex.set(0);
    this.chosenAnswer.set(null);
    this.laneId.set('anything');
    this.thread.set([]);
    this.draft.set('');
    this.focusAfterRender(() => this.stepHeading()?.nativeElement);
  }

  private cancelPending(): void {
    this.pending?.unsubscribe();
    this.pending = null;
    this.isThinking.set(false);
  }

  private receive(reply: ChatReply): void {
    this.thread.update((thread) => [
      ...thread,
      { message: { role: 'guide', text: reply.text }, action: reply.action },
    ]);
    this.isThinking.set(false);
    this.focusAfterRender(() => this.composer()?.nativeElement);
  }

  private focusAfterRender(target: () => HTMLElement | undefined): void {
    afterNextRender(() => target()?.focus(), { injector: this.injector });
  }
}
