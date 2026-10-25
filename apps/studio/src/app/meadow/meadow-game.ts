import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Stage = 'choose' | 'playing' | 'level-complete' | 'finished';
type Direction = 'up' | 'down' | 'left' | 'right';
type Slot = 'head' | 'neck' | 'cape' | 'coat';

interface Pony {
  readonly name: string;
  readonly image: string;
  readonly color: string;
}

interface Garment {
  readonly id: string;
  readonly name: string;
  readonly slot: Slot;
  readonly icon: string;
}

interface MeadowLevel {
  readonly name: string;
  readonly hint: string;
  readonly blocked: readonly number[];
  readonly gem: number;
  readonly chest: number;
  readonly garment: Garment;
  readonly theme: string;
}

const COLUMNS = 7;
const ROWS = 5;
const START = 28;
const GATE = 6;
const STORAGE_KEY = 'moonbeam-meadow-v2';

const PONIES: readonly Pony[] = [
  { name: 'Pippa', image: 'images/meadow/pippa-winged.png', color: 'peach' },
  { name: 'Clover', image: 'images/meadow/clover-winged.png', color: 'mint' },
  { name: 'Miso', image: 'images/meadow/miso-winged.png', color: 'violet' },
];

const GARMENTS: readonly Garment[] = [
  { id: 'rose-cape', name: 'Rose cape', slot: 'cape', icon: '♣' },
  { id: 'flower-crown', name: 'Flower crown', slot: 'head', icon: '✿' },
  { id: 'sky-scarf', name: 'Sky scarf', slot: 'neck', icon: '〰' },
  { id: 'star-coat', name: 'Star coat', slot: 'coat', icon: '✦' },
  { id: 'moon-crown', name: 'Moon crown', slot: 'head', icon: '☾' },
  { id: 'violet-cape', name: 'Violet cape', slot: 'cape', icon: '♣' },
  { id: 'sun-scarf', name: 'Sun scarf', slot: 'neck', icon: '〰' },
  { id: 'rainbow-coat', name: 'Rainbow coat', slot: 'coat', icon: '◆' },
];

const LEVELS: readonly MeadowLevel[] = [
  { name: 'Blossom Field', hint: 'A blue gem is hiding nearby. Find it to fly!', blocked: [8, 16, 23, 26], gem: 30, chest: 19, garment: GARMENTS[0], theme: 'blossom' },
  { name: 'Cloud Crossing', hint: 'The clouds make a wall. Your wings need the blue gem.', blocked: [14, 15, 16, 17, 18, 19, 20], gem: 29, chest: 10, garment: GARMENTS[1], theme: 'cloud' },
  { name: 'Glitter Brook', hint: 'Fly across the brook to the hidden chest.', blocked: [14, 15, 16, 17, 18, 19, 20, 8, 9], gem: 31, chest: 2, garment: GARMENTS[2], theme: 'brook' },
  { name: 'Velvet Valley', hint: 'A winding trail leads to another outfit.', blocked: [14, 15, 16, 17, 18, 19, 20, 11, 12, 25], gem: 30, chest: 4, garment: GARMENTS[3], theme: 'velvet' },
  { name: 'Frosted Sky', hint: 'The blue gem lets you soar over the snow clouds.', blocked: [14, 15, 16, 17, 18, 19, 20, 8, 9, 10], gem: 32, chest: 3, garment: GARMENTS[4], theme: 'frost' },
  { name: 'Starlight Ridge', hint: 'Look for the chest beyond the starry clouds.', blocked: [14, 15, 16, 17, 18, 19, 20, 9, 10, 11], gem: 29, chest: 1, garment: GARMENTS[5], theme: 'stars' },
  { name: 'Rainbow Hollow', hint: 'Your new scarf is waiting across the hollow.', blocked: [14, 15, 16, 17, 18, 19, 20, 7, 8, 9], gem: 30, chest: 12, garment: GARMENTS[6], theme: 'rainbow' },
  { name: 'Moon Castle', hint: 'One last treasure is tucked beside the moon gate.', blocked: [14, 15, 16, 17, 18, 19, 20, 9, 10, 11, 22, 23], gem: 31, chest: 0, garment: GARMENTS[7], theme: 'moon' },
];

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

interface SavedGame {
  pony: string;
  levelIndex: number;
  unlocked: string[];
  equipped: Partial<Record<Slot, string>>;
  finished?: boolean;
}

@Component({
  selector: 'app-meadow-game',
  imports: [RouterLink],
  templateUrl: './meadow-game.html',
  styleUrl: './meadow-game.scss',
})
export class MeadowGamePage {
  protected readonly ponies = PONIES;
  protected readonly cells = Array.from({ length: COLUMNS * ROWS }, (_, index) => index);
  protected readonly levelCount = LEVELS.length;
  protected readonly stage = signal<Stage>('choose');
  protected readonly pony = signal<Pony | null>(null);
  protected readonly levelIndex = signal(0);
  protected readonly position = signal(START);
  protected readonly flying = signal(false);
  protected readonly foundTreasure = signal(false);
  protected readonly unlocked = signal<readonly string[]>([]);
  protected readonly equipped = signal<Partial<Record<Slot, string>>>({});
  protected readonly feedback = signal('');
  protected readonly level = computed(() => LEVELS[this.levelIndex()]);
  protected readonly wardrobe = computed(() => GARMENTS.filter((item) => this.unlocked().includes(item.id)));
  protected readonly saved = signal<SavedGame | null>(this.readSaved());

  protected choosePony(pony: Pony): void {
    this.pony.set(pony);
    this.levelIndex.set(0);
    this.unlocked.set([]);
    this.equipped.set({});
    this.startLevel();
  }

  protected continueGame(): void {
    const saved = this.saved();
    if (!saved) return;
    const pony = PONIES.find((friend) => friend.name === saved.pony);
    if (!pony) return;
    this.pony.set(pony);
    this.levelIndex.set(Math.min(Math.max(saved.levelIndex, 0), LEVELS.length - 1));
    this.unlocked.set(saved.unlocked.filter((id) => GARMENTS.some((item) => item.id === id)));
    this.equipped.set(saved.equipped);
    if (saved.finished) {
      this.position.set(GATE);
      this.flying.set(true);
      this.foundTreasure.set(true);
      this.stage.set('finished');
      return;
    }
    this.startLevel();
  }

  protected isBlocked(cell: number): boolean { return this.level().blocked.includes(cell); }
  protected isGem(cell: number): boolean { return cell === this.level().gem && !this.flying(); }
  protected isChest(cell: number): boolean { return cell === this.level().chest && !this.foundTreasure(); }
  protected isGate(cell: number): boolean { return cell === GATE; }
  protected isPlayer(cell: number): boolean { return cell === this.position(); }
  protected isEquipped(item: Garment): boolean { return this.equipped()[item.slot] === item.id; }
  protected worn(slot: Slot): string | undefined { return this.equipped()[slot]; }

  protected cellLabel(cell: number): string {
    const location = `row ${Math.floor(cell / COLUMNS) + 1}, column ${cell % COLUMNS + 1}`;
    if (this.isPlayer(cell)) return `${this.pony()?.name} is here at ${location}`;
    if (this.isGem(cell)) return `Blue flying gem at ${location}`;
    if (this.isChest(cell)) return `Clothing treasure chest at ${location}`;
    if (this.isGate(cell)) return `Rainbow gate at ${location}`;
    return `${this.isBlocked(cell) ? 'Cloud' : 'Meadow path'} at ${location}`;
  }

  protected canStepTo(cell: number): boolean {
    return this.stage() === 'playing' && neighbours(this.position()).includes(cell)
      && (!this.isBlocked(cell) || this.flying());
  }

  protected tapCell(cell: number): void {
    if (this.canStepTo(cell)) this.stepTo(cell);
  }

  protected move(direction: Direction): void {
    if (this.stage() !== 'playing') return;
    const current = this.position();
    const row = Math.floor(current / COLUMNS);
    const column = current % COLUMNS;
    if ((direction === 'up' && row === 0) || (direction === 'down' && row === ROWS - 1)
      || (direction === 'left' && column === 0) || (direction === 'right' && column === COLUMNS - 1)) return;
    const next = direction === 'up' ? current - COLUMNS
      : direction === 'down' ? current + COLUMNS
      : direction === 'left' ? current - 1 : current + 1;
    if (this.isBlocked(next) && !this.flying()) {
      this.feedback.set('A cloud blocks the way. Find the blue gem to fly over it!');
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
    if (!direction || this.stage() !== 'playing') return;
    event.preventDefault();
    this.move(direction);
  }

  protected equip(item: Garment): void {
    if (!this.unlocked().includes(item.id)) return;
    this.equipped.update((worn) => ({ ...worn, [item.slot]: item.id }));
    this.save();
  }

  protected nextLevel(): void {
    if (this.stage() !== 'level-complete') return;
    this.levelIndex.update((index) => index + 1);
    this.startLevel();
  }

  protected playAgain(): void {
    this.stage.set('choose');
    this.pony.set(null);
    this.levelIndex.set(0);
    this.unlocked.set([]);
    this.equipped.set({});
    this.saved.set(null);
    this.feedback.set('');
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
  }

  private startLevel(): void {
    this.position.set(START);
    this.flying.set(false);
    this.foundTreasure.set(false);
    this.feedback.set('Find the blue gem, fly to the treasure chest, then reach the rainbow gate.');
    this.stage.set('playing');
    this.save();
  }

  private stepTo(cell: number): void {
    this.position.set(cell);
    if (this.isGem(cell)) {
      this.flying.set(true);
      this.feedback.set('Blue gem found! Your wings can fly over clouds for this level.');
    } else if (this.isChest(cell)) {
      const garment = this.level().garment;
      this.foundTreasure.set(true);
      this.unlocked.update((items) => [...new Set([...items, garment.id])]);
      this.equip(garment);
      this.feedback.set(`Treasure! ${garment.name} is now in your wardrobe.`);
    } else if (cell === GATE && !this.foundTreasure()) {
      this.feedback.set('Find the clothing treasure chest before you leave this level.');
    } else if (cell === GATE) {
      this.stage.set(this.levelIndex() === LEVELS.length - 1 ? 'finished' : 'level-complete');
      this.feedback.set('The rainbow gate is open!');
      this.save();
    } else {
      this.feedback.set(this.flying() ? 'Flying! Follow the trail to the treasure.' : 'Keep looking for the blue gem.');
    }
  }

  private save(): void {
    const pony = this.pony();
    if (!pony) return;
    const value: SavedGame = {
      pony: pony.name,
      levelIndex: this.stage() === 'level-complete'
        ? this.levelIndex() + 1 : this.levelIndex(),
      unlocked: [...this.unlocked()],
      equipped: this.equipped(),
      finished: this.stage() === 'finished',
    };
    this.saved.set(value);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* Play still works without storage. */ }
  }

  private readSaved(): SavedGame | null {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!value || typeof value.pony !== 'string' || !Number.isInteger(value.levelIndex)
        || !Array.isArray(value.unlocked) || typeof value.equipped !== 'object') return null;
      return value as SavedGame;
    } catch { return null; }
  }
}
