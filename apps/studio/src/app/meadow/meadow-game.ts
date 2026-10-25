import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Stage = 'choose' | 'playing' | 'level-complete' | 'finished';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Pony {
  readonly name: string;
  readonly gift: string;
  readonly image: string;
}

interface MeadowLevel {
  readonly name: string;
  readonly hint: string;
  readonly puddles: readonly number[];
  readonly lightCount: number;
}

const COLUMNS = 7;
const ROWS = 5;
const START = 28;
const GATE = 6;

const PONIES: readonly Pony[] = [
  { name: 'Pippa', gift: 'A brave little leap', image: 'images/meadow/pippa.png' },
  { name: 'Clover', gift: 'A clever new idea', image: 'images/meadow/clover.png' },
  { name: 'Miso', gift: 'A pocketful of kindness', image: 'images/meadow/miso.png' },
];

const LEVELS: readonly MeadowLevel[] = [
  { name: 'The sleepy meadow', hint: 'The first lights are hiding in the grass.', puddles: [8, 16, 23, 26], lightCount: 3 },
  { name: 'The misty brook', hint: 'Find a winding path around the puddles.', puddles: [2, 9, 17, 22, 31], lightCount: 4 },
  { name: 'The twilight grove', hint: 'One last journey to wake the rainbow.', puddles: [8, 10, 17, 18, 23, 30], lightCount: 5 },
];

const shuffle = <T>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
};

const neighbours = (cell: number): number[] => {
  const row = Math.floor(cell / COLUMNS);
  const column = cell % COLUMNS;
  return [
    ...(row > 0 ? [cell - COLUMNS] : []),
    ...(row < ROWS - 1 ? [cell + COLUMNS] : []),
    ...(column > 0 ? [cell - 1] : []),
    ...(column < COLUMNS - 1 ? [cell + 1] : []),
  ];
};

const reachableCells = (puddles: readonly number[]): number[] => {
  const visited = new Set([START]);
  const queue = [START];
  for (const cell of queue) {
    for (const next of neighbours(cell)) {
      if (puddles.includes(next) || visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return queue.filter((cell) => cell !== START && cell !== GATE);
};

@Component({
  selector: 'app-meadow-game',
  imports: [RouterLink],
  templateUrl: './meadow-game.html',
  styleUrl: './meadow-game.scss',
})
export class MeadowGamePage {
  protected readonly ponies = PONIES;
  protected readonly cells = Array.from({ length: COLUMNS * ROWS }, (_, index) => index);
  protected readonly stage = signal<Stage>('choose');
  protected readonly pony = signal<Pony | null>(null);
  protected readonly levelIndex = signal(0);
  protected readonly position = signal(START);
  protected readonly lights = signal<readonly number[]>([]);
  protected readonly moves = signal(0);
  protected readonly feedback = signal('');
  protected readonly level = computed(() => LEVELS[this.levelIndex()]);
  protected readonly gathered = computed(() => this.level().lightCount - this.lights().length);
  protected readonly isPlaying = computed(() => this.stage() === 'playing');

  protected choosePony(pony: Pony): void {
    this.pony.set(pony);
    this.levelIndex.set(0);
    this.moves.set(0);
    this.startLevel();
  }

  protected isPuddle(cell: number): boolean { return this.level().puddles.includes(cell); }
  protected isLight(cell: number): boolean { return this.lights().includes(cell); }
  protected isGate(cell: number): boolean { return cell === GATE; }
  protected isPlayer(cell: number): boolean { return cell === this.position(); }
  protected cellLabel(cell: number): string {
    const location = `row ${Math.floor(cell / COLUMNS) + 1}, column ${cell % COLUMNS + 1}`;
    if (this.isPlayer(cell)) return `${this.pony()?.name} is here at ${location}`;
    if (this.isLight(cell)) return `Moonlight at ${location}`;
    if (this.isPuddle(cell)) return `Puddle at ${location}`;
    if (this.isGate(cell)) return `Rainbow gate at ${location}`;
    return `Meadow path at ${location}`;
  }
  protected canStepTo(cell: number): boolean {
    return this.isPlaying() && !this.isPuddle(cell) && neighbours(this.position()).includes(cell);
  }

  protected tapCell(cell: number): void {
    if (!this.canStepTo(cell)) return;
    this.stepTo(cell);
  }

  protected move(direction: Direction): void {
    if (!this.isPlaying()) return;
    const current = this.position();
    const row = Math.floor(current / COLUMNS);
    const column = current % COLUMNS;
    const next = direction === 'up' ? current - COLUMNS
      : direction === 'down' ? current + COLUMNS
      : direction === 'left' ? current - 1 : current + 1;
    if ((direction === 'up' && row === 0) ||
        (direction === 'down' && row === ROWS - 1) ||
        (direction === 'left' && column === 0) ||
        (direction === 'right' && column === COLUMNS - 1)) return;
    if (this.isPuddle(next)) {
      this.feedback.set('Splash! Try a path around the puddle.');
      return;
    }
    this.stepTo(next);
  }

  @HostListener('window:keydown', ['$event'])
  protected handleKey(event: KeyboardEvent): void {
    const keys: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    };
    const direction = keys[event.key];
    if (!direction || !this.isPlaying()) return;
    event.preventDefault();
    this.move(direction);
  }

  protected nextLevel(): void {
    if (this.stage() !== 'level-complete') return;
    this.levelIndex.update((index) => index + 1);
    this.startLevel();
  }

  protected playAgain(): void {
    this.stage.set('choose');
    this.pony.set(null);
    this.feedback.set('');
  }

  private startLevel(): void {
    const level = this.level();
    this.position.set(START);
    this.lights.set(shuffle(reachableCells(level.puddles)).slice(0, level.lightCount));
    this.feedback.set('Collect every moonlight, then reach the rainbow gate.');
    this.stage.set('playing');
  }

  private stepTo(cell: number): void {
    this.position.set(cell);
    this.moves.update((count) => count + 1);
    if (this.isLight(cell)) {
      this.lights.update((lights) => lights.filter((light) => light !== cell));
      this.feedback.set(`Moonlight found! ${this.gathered()} of ${this.level().lightCount} collected.`);
    } else if (cell === GATE && this.lights().length > 0) {
      this.feedback.set(`${this.lights().length} moonlights are still hiding. Keep exploring!`);
    } else {
      this.feedback.set('Keep going!');
    }
    if (cell === GATE && this.lights().length === 0) {
      this.stage.set(this.levelIndex() === LEVELS.length - 1 ? 'finished' : 'level-complete');
      this.feedback.set('You lit the rainbow gate!');
    }
  }
}
