import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AgeBand, STEAM_GALLERY_ENDPOINT, STEAM_LENSES, STEAM_MISSION_ENDPOINT,
  STEAM_NOTICES, STEAM_THEMES, SteamGallery, SteamImage, SteamLens,
  SteamMissionReply, SteamNotice, SteamTheme,
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
  private galleryPending: Subscription | null = null;
  private missionPending: Subscription | null = null;

  readonly embedded = input(false);
  protected readonly ages: readonly { id: AgeBand; label: string }[] = [
    { id: '7-10', label: 'Ages 7–10' },
    { id: '11-13', label: 'Ages 11–13' },
    { id: '14-16', label: 'Ages 14–16' },
  ];
  protected readonly ageBand = this.journey.ageBand;
  protected readonly themes = STEAM_THEMES;
  protected readonly lenses = STEAM_LENSES;
  protected readonly notices = STEAM_NOTICES;
  protected readonly theme = signal<SteamTheme>('mars');
  protected readonly page = signal(1);
  protected readonly gallery = signal<SteamGallery | null>(null);
  protected readonly galleryLoading = signal(false);
  protected readonly galleryError = signal('');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly selectedImage = computed<SteamImage | null>(
    () => this.gallery()?.images.find((image) => image.id === this.selectedId()) ?? null,
  );
  protected readonly lens = signal<SteamLens>('science');
  protected readonly notice = signal<SteamNotice>('pattern');
  protected readonly mission = signal<SteamMissionReply | null>(null);
  protected readonly missionLoading = signal(false);
  protected readonly missionError = signal('');
  protected readonly remix = signal(0);
  protected readonly tried = signal(false);
  protected readonly saved = this.journey.steamSaved;

  constructor() {
    this.journey.activity.set('steam');
    inject(DestroyRef).onDestroy(() => {
      this.galleryPending?.unsubscribe();
      this.missionPending?.unsubscribe();
    });
    this.loadGallery();
  }

  protected selectAge(age: AgeBand): void {
    this.ageBand.set(age);
  }

  protected selectTheme(theme: SteamTheme): void {
    if (theme === this.theme()) return;
    this.theme.set(theme);
    this.page.set(1);
    this.loadGallery();
  }

  protected moreImages(): void {
    this.page.update((page) => page >= 10 ? 1 : page + 1);
    this.loadGallery();
  }

  protected retryGallery(): void {
    this.loadGallery();
  }

  protected selectImage(image: SteamImage): void {
    if (image.id === this.selectedId()) return;
    this.selectedId.set(image.id);
    this.resetMission();
  }

  protected shuffleImage(): void {
    const images = this.gallery()?.images ?? [];
    if (images.length < 2) return;
    const current = images.findIndex((item) => item.id === this.selectedId());
    const pick = Math.floor(Math.random() * (images.length - 1));
    this.selectImage(images[pick >= current ? pick + 1 : pick]);
  }

  protected selectLens(lens: SteamLens): void {
    if (lens === this.lens()) return;
    this.lens.set(lens);
    this.resetMission();
  }

  protected selectNotice(notice: SteamNotice): void {
    if (notice === this.notice()) return;
    this.notice.set(notice);
    this.resetMission();
  }

  protected makeMission(remix = false): void {
    const ageBand = this.ageBand();
    const image = this.selectedImage();
    const gallery = this.gallery();
    if (!ageBand || !image || !gallery || this.missionLoading()) return;
    if (remix) this.remix.update((value) => Math.min(value + 1, 50));
    this.missionPending?.unsubscribe();
    this.missionLoading.set(true);
    this.missionError.set('');
    this.missionPending = this.http.post<SteamMissionReply>(STEAM_MISSION_ENDPOINT, {
      ageBand,
      theme: gallery.theme,
      page: gallery.page,
      imageId: image.id,
      lens: this.lens(),
      notice: this.notice(),
      remix: this.remix(),
    }).pipe(
      timeout({ first: 28_000 }),
      catchError((error: unknown) => {
        this.missionError.set(error instanceof HttpErrorResponse && error.status === 429
          ? 'Take a short pause, then try again.'
          : 'The mission maker is unavailable. Please try again.');
        return of(null);
      }),
    ).subscribe((reply) => {
      if (validMission(reply)) {
        this.mission.set(reply);
        this.tried.set(false);
      } else if (reply) {
        this.missionError.set('The mission maker sent an incomplete idea. Please try again.');
      }
      this.missionLoading.set(false);
    });
  }

  protected markTried(): void {
    this.tried.set(true);
  }

  protected saveMission(): void {
    const image = this.selectedImage();
    const mission = this.mission();
    if (!image || !mission) return;
    const id = `${image.id}:${this.lens()}:${this.notice()}:${this.remix()}`;
    this.saved.update((items) => [
      { id, imageTitle: image.title, mission },
      ...items.filter((item) => item.id !== id),
    ].slice(0, 8));
  }

  protected isSaved(): boolean {
    const image = this.selectedImage();
    if (!image) return false;
    const id = `${image.id}:${this.lens()}:${this.notice()}:${this.remix()}`;
    return this.saved().some((item) => item.id === id);
  }

  protected removeSaved(id: string): void {
    this.saved.update((items) => items.filter((item) => item.id !== id));
  }

  private loadGallery(): void {
    this.galleryPending?.unsubscribe();
    this.missionPending?.unsubscribe();
    this.gallery.set(null);
    this.selectedId.set(null);
    this.resetMission();
    this.galleryError.set('');
    this.galleryLoading.set(true);
    this.galleryPending = this.http.get<SteamGallery>(
      `${STEAM_GALLERY_ENDPOINT}?theme=${this.theme()}&page=${this.page()}`,
    ).pipe(
      timeout({ first: 10_000 }),
      catchError(() => {
        this.galleryError.set('NASA’s image library is unavailable right now. Try again in a moment.');
        return of(null);
      }),
    ).subscribe((gallery) => {
      if (gallery?.images?.length && gallery.theme === this.theme() && gallery.page === this.page()) {
        this.gallery.set(gallery);
        this.selectedId.set(gallery.images[0].id);
      } else if (gallery) {
        this.galleryError.set('NASA did not return any usable images for this topic.');
      }
      this.galleryLoading.set(false);
    });
  }

  private resetMission(): void {
    this.missionPending?.unsubscribe();
    this.mission.set(null);
    this.missionLoading.set(false);
    this.missionError.set('');
    this.remix.set(0);
    this.tried.set(false);
  }
}

const validMission = (reply: SteamMissionReply | null): reply is SteamMissionReply =>
  !!reply &&
  (reply.source === 'ai' || reply.source === 'starter') &&
  [reply.title, reply.challenge, reply.action, reply.question]
    .every((value) => typeof value === 'string' && value.length > 0);
