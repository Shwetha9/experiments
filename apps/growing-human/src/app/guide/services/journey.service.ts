import { Injectable, signal } from '@angular/core';
import { AgeBand } from '../models/growing-human';
import { SteamMissionReply } from '@shwetha/growing-human-contracts';

/** In-memory route state, cleared on a reload or Start over. */
@Injectable({ providedIn: 'root' })
export class GrowingHumanJourney {
  readonly ageBand = signal<AgeBand | null>(null);
  readonly activity = signal<'guide' | 'discover' | 'steam'>('guide');
  readonly steamSaved = signal<readonly {
    readonly id: string;
    readonly imageTitle: string;
    readonly mission: SteamMissionReply;
  }[]>([]);
}
