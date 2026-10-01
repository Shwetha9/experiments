import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AgeBand, STEAM_MISSIONS, STEAM_QUESTION_ENDPOINT,
  SteamQuestionReply,
} from '@shwetha/growing-human-contracts';
import { Subscription, catchError, of, timeout } from 'rxjs';
import { GrowingHumanJourney } from '../services/journey.service';

@Component({
  selector: 'app-steam-lab',
  imports: [RouterLink],
  templateUrl: './steam-lab.html',
  styleUrl: './steam-lab.scss',
})
export class SteamLabPage {
  private readonly http = inject(HttpClient);
  private readonly journey = inject(GrowingHumanJourney);
  private pending: Subscription | null = null;

  protected readonly ages: readonly { id: AgeBand; label: string }[] = [
    { id: '7-10', label: 'Ages 7–10' },
    { id: '11-13', label: 'Ages 11–13' },
    { id: '14-16', label: 'Ages 14–16' },
  ];
  protected readonly ageBand = this.journey.ageBand;
  protected readonly missions = STEAM_MISSIONS;
  protected readonly missionIndex = signal(0);
  protected readonly selectedChoice = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly followUp = signal<SteamQuestionReply | null>(null);
  protected readonly completed = this.journey.steamCompleted;
  protected readonly mission = computed(() => this.missions[this.missionIndex()]);
  protected readonly isCorrect = computed(() => this.selectedChoice() === this.mission().correctChoice);

  constructor() {
    this.journey.activity.set('discover');
    inject(DestroyRef).onDestroy(() => this.pending?.unsubscribe());
  }

  protected selectAge(age: AgeBand): void {
    this.ageBand.set(age);
  }

  protected selectMission(index: number): void {
    if (index === this.missionIndex()) return;
    this.pending?.unsubscribe();
    this.missionIndex.set(index);
    this.selectedChoice.set(null);
    this.followUp.set(null);
    this.loading.set(false);
  }

  protected predict(choiceId: string): void {
    const ageBand = this.ageBand();
    const mission = this.mission();
    if (!ageBand || this.selectedChoice()) return;
    this.selectedChoice.set(choiceId);
    this.completed.update((ids) => ids.includes(mission.id) ? ids : [...ids, mission.id]);
    this.loading.set(true);
    this.followUp.set(null);
    this.pending = this.http.post<SteamQuestionReply>(STEAM_QUESTION_ENDPOINT, {
      ageBand,
      missionId: mission.id,
      choiceId,
    }).pipe(
      timeout({ first: 9000 }),
      catchError(() => of({ question: mission.nextQuestion, source: 'curated' as const })),
    ).subscribe((reply) => {
      this.followUp.set(validReply(reply) ? reply : { question: mission.nextQuestion, source: 'curated' });
      this.loading.set(false);
    });
  }

  protected nextMission(): void {
    this.selectMission((this.missionIndex() + 1) % this.missions.length);
  }
}

const validReply = (reply: SteamQuestionReply | null): reply is SteamQuestionReply =>
  !!reply &&
  (reply.source === 'ai' || reply.source === 'curated') &&
  typeof reply.question === 'string' &&
  reply.question.length <= 150 &&
  reply.question.endsWith('?');
