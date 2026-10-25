import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Stage = 'choose' | 'pattern' | 'mix' | 'stones' | 'finished';
type Paint = 'rose' | 'sun' | 'sky';

interface Pony {
  readonly name: string;
  readonly gift: string;
  readonly colour: string;
  readonly image: string;
}

const PONIES: readonly Pony[] = [
  { name: 'Pippa', gift: 'A brave little leap', colour: '#e9b3a9', image: 'images/meadow/pippa.png' },
  { name: 'Clover', gift: 'A clever new idea', colour: '#c5d79a', image: 'images/meadow/clover.png' },
  { name: 'Miso', gift: 'A pocketful of kindness', colour: '#b9b5e9', image: 'images/meadow/miso.png' },
];

const FLOWERS = [
  { icon: '✿', label: 'rose flower', colour: '#ee879c' },
  { icon: '✦', label: 'gold sparkle', colour: '#eebd65' },
  { icon: '❀', label: 'blue flower', colour: '#91bbdf' },
  { icon: '◆', label: 'mint leaf', colour: '#91c6a4' },
] as const;

const PAINTS: readonly { id: Paint; label: string; colour: string }[] = [
  { id: 'rose', label: 'Rose pink', colour: '#ed8499' },
  { id: 'sun', label: 'Sun yellow', colour: '#f2c766' },
  { id: 'sky', label: 'Sky blue', colour: '#81b8df' },
];

const RECIPES = [
  { name: 'peach', colour: '#f1aa78', pair: ['rose', 'sun'] },
  { name: 'leaf green', colour: '#a2c78b', pair: ['sun', 'sky'] },
  { name: 'lavender', colour: '#b49ad4', pair: ['rose', 'sky'] },
] as const;

const shuffle = <T>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
};

@Component({
  selector: 'app-meadow-game',
  imports: [RouterLink],
  templateUrl: './meadow-game.html',
  styleUrl: './meadow-game.scss',
})
export class MeadowGamePage {
  private revealTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly ponies = PONIES;
  protected readonly flowers = FLOWERS;
  protected readonly paints = PAINTS;
  protected readonly stage = signal<Stage>('choose');
  protected readonly pony = signal<Pony | null>(null);
  protected readonly pattern = signal<readonly number[]>([]);
  protected readonly patternVisible = signal(true);
  protected readonly patternStep = signal(0);
  protected readonly target = signal<(typeof RECIPES)[number]>(RECIPES[0]);
  protected readonly chosenPaints = signal<readonly Paint[]>([]);
  protected readonly stones = signal<readonly number[]>([]);
  protected readonly stoneStep = signal(0);
  protected readonly completed = signal(0);
  protected readonly stageWon = signal(false);
  protected readonly feedback = signal('');
  protected readonly pickedColour = computed(() => {
    const picked = this.chosenPaints();
    if (picked.length !== 2) return null;
    return RECIPES.find((recipe) => recipe.pair.every((colour) => picked.includes(colour))) ?? null;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  protected choosePony(pony: Pony): void {
    this.pony.set(pony);
    this.completed.set(0);
    this.startPattern();
  }

  protected tapFlower(index: number): void {
    if (this.stage() !== 'pattern' || this.stageWon() || this.patternVisible()) return;
    const next = this.patternStep();
    if (index !== this.pattern()[next]) {
      this.feedback.set('Not quite. Watch the flowers again and have another go!');
      this.patternStep.set(0);
      this.showPattern();
      return;
    }
    this.patternStep.set(next + 1);
    this.feedback.set(`${next + 1} of ${this.pattern().length} flowers remembered`);
    if (next + 1 === this.pattern().length) this.win('You remembered the whole flower rhythm!');
  }

  protected showPattern(): void {
    this.clearTimer();
    this.patternVisible.set(true);
    this.revealTimer = setTimeout(() => {
      this.patternVisible.set(false);
      this.feedback.set('Your turn! Tap the flowers in the same order.');
    }, 4200);
  }

  protected choosePaint(paint: Paint): void {
    if (this.stage() !== 'mix' || this.stageWon()) return;
    const selected = this.chosenPaints();
    if (selected.includes(paint)) {
      this.chosenPaints.set(selected.filter((item) => item !== paint));
      return;
    }
    if (selected.length === 2) return;
    const next = [...selected, paint];
    this.chosenPaints.set(next);
    if (next.length === 2) {
      const recipe = RECIPES.find((item) => item.pair.every((colour) => next.includes(colour)));
      if (recipe === this.target()) this.win(`You made ${recipe.name}! A colour spark is yours.`);
      else this.feedback.set(`That makes ${recipe?.name ?? 'a new colour'}. Try another pair!`);
    }
  }

  protected clearPaints(): void {
    this.chosenPaints.set([]);
    this.feedback.set('Choose two colours to mix.');
  }

  protected tapStone(number: number): void {
    if (this.stage() !== 'stones' || this.stageWon() || number <= this.stoneStep()) return;
    if (number !== this.stoneStep() + 1) {
      this.feedback.set(`Look for stone ${this.stoneStep() + 1} next.`);
      return;
    }
    this.stoneStep.set(number);
    this.feedback.set(`Hop! ${number} of 5 stones crossed.`);
    if (number === 5) this.win('You crossed the stream! The meadow is glowing again.');
  }

  protected continue(): void {
    if (!this.stageWon()) return;
    if (this.stage() === 'pattern') this.startMix();
    else if (this.stage() === 'mix') this.startStones();
    else if (this.stage() === 'stones') this.stage.set('finished');
  }

  protected playAgain(): void {
    this.clearTimer();
    this.pony.set(null);
    this.stage.set('choose');
    this.completed.set(0);
    this.stageWon.set(false);
    this.feedback.set('');
  }

  private startPattern(): void {
    this.stage.set('pattern');
    this.stageWon.set(false);
    this.patternStep.set(0);
    this.pattern.set(Array.from({ length: 4 }, () => Math.floor(Math.random() * FLOWERS.length)));
    this.feedback.set('Look closely. The flower rhythm will hide in a moment.');
    this.showPattern();
  }

  private startMix(): void {
    this.clearTimer();
    this.stage.set('mix');
    this.stageWon.set(false);
    this.target.set(RECIPES[Math.floor(Math.random() * RECIPES.length)]);
    this.chosenPaints.set([]);
    this.feedback.set('Pick two paint drops. Tap a drop again to unpick it.');
  }

  private startStones(): void {
    this.stage.set('stones');
    this.stageWon.set(false);
    this.stones.set(shuffle([1, 2, 3, 4, 5]));
    this.stoneStep.set(0);
    this.feedback.set('Tap the stones from 1 to 5.');
  }

  private win(message: string): void {
    this.stageWon.set(true);
    this.completed.update((count) => count + 1);
    this.feedback.set(message);
  }

  private clearTimer(): void {
    if (this.revealTimer) clearTimeout(this.revealTimer);
    this.revealTimer = null;
  }
}
