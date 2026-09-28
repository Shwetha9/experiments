import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EarthImage, EarthImageClient } from '../services/earth-image.service';

@Component({
  selector: 'app-earth-image',
  templateUrl: './earth-image.html',
  styleUrl: './earth-image.scss',
})
export class EarthImagePanel {
  private readonly client = inject(EarthImageClient);
  private pending: Subscription | null = null;

  protected readonly image = signal<EarthImage | null>(null);
  protected readonly loading = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.pending?.unsubscribe());
    this.load();
  }

  protected load(): void {
    this.pending?.unsubscribe();
    this.loading.set(true);
    this.pending = this.client.latest().subscribe((image) => {
      this.image.set(image);
      this.loading.set(false);
    });
  }

  protected imageFailed(): void {
    this.image.set(null);
  }
}
