import { Component, HostListener, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Stage = 'choose' | 'story' | 'playing' | 'level-complete' | 'choice' | 'finished';
type Direction = 'up' | 'down' | 'left' | 'right';
type Slot = 'head' | 'neck' | 'cape' | 'coat';

interface Pony {
  readonly name: string;
  readonly image: string;
  readonly surprised: string;
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
  readonly clue: number;
  readonly clueText: string;
}

interface Episode {
  readonly title: string;
  readonly place: string;
  readonly opening: readonly string[];
  readonly ending: string;
  readonly choices: readonly { readonly label: string; readonly result: string }[];
}

const COLUMNS = 7;
const ROWS = 5;
const START = 28;
const GATE = 6;
const STORAGE_KEY = 'moonbeam-meadow-v2';
const BRANCH_GEMS: Readonly<Record<number, number>> = { 2: 29, 4: 30, 6: 32 };

const PONIES: readonly Pony[] = [
  { name: 'Pippa', image: 'images/meadow/pippa-winged.png', surprised: 'images/meadow/pippa-surprised.png', color: 'peach' },
  { name: 'Clover', image: 'images/meadow/clover-winged.png', surprised: 'images/meadow/clover-surprised.png', color: 'mint' },
  { name: 'Miso', image: 'images/meadow/miso-winged.png', surprised: 'images/meadow/miso-surprised.png', color: 'violet' },
];

const EPISODES: readonly Episode[] = [
  {
    title: 'The Map That Vanished', place: 'Blossom Field → Cloud Crossing',
    opening: [
      'At dawn, the Moonbeam Map disappeared from the village observatory. Without it, the paths between the sky islands are fading.',
      'A tiny paper star flutters out of the window. It points toward Blossom Field. Find the blue gem to wake your wings, then follow the trail!',
    ],
    ending: 'Inside the second treasure chest is a torn corner of the map. Someone has drawn a silver bell beside a river.',
    choices: [
      { label: 'Follow the river', result: 'You follow the sound of running water. The silver bell must be close.' },
      { label: 'Ask the cloud keeper', result: 'The cloud keeper remembers a bell ringing beneath Glitter Brook.' },
    ],
  },
  {
    title: 'The Bell Beneath the Brook', place: 'Glitter Brook → Velvet Valley',
    opening: [
      'The brook is unusually quiet. Its silver bell is trapped under a spell, and the fish have forgotten the way home.',
      'The torn map corner glows. Search the bank, gather a flying gem, and discover what the bell is trying to tell you.',
    ],
    ending: 'The bell rings again! In its reflection you see a snowy tower, and a shadow carrying the rest of the map.',
    choices: [
      { label: 'Help the lost fish first', result: 'The fish show you a secret current leading to Frosted Sky.' },
      { label: 'Chase the shadow', result: 'You spot a trail of silver dust drifting toward Frosted Sky.' },
    ],
  },
  {
    title: 'The Tower of Borrowed Stars', place: 'Frosted Sky → Starlight Ridge',
    opening: [
      'Snow is falling upward around the tower. Inside, someone has borrowed the stars to light a lonely room.',
      'A winged pony can cross the clouds, but only after finding the blue gem. Look for clues before you decide what to do.',
    ],
    ending: 'The shadow is a small sky fox. It took the map because it was afraid of being alone in the dark.',
    choices: [
      { label: 'Invite the fox along', result: 'The fox joins your team and shows you the road to Rainbow Hollow.' },
      { label: 'Make a lantern for the fox', result: 'The fox smiles at your lantern and shares the road to Rainbow Hollow.' },
    ],
  },
  {
    title: 'The Moon Castle Promise', place: 'Rainbow Hollow → Moon Castle',
    opening: [
      'The last piece of the Moonbeam Map waits beyond Rainbow Hollow. The castle gate opens only for someone who brings a friend.',
      'Your clothes, your courage, and the friends you helped brought you here. Find the gem, claim the final treasures, and make the sky whole.',
    ],
    ending: 'The map shines again. The fox has a home, the stars return, and every sky island lights a path to the next adventure.',
    choices: [
      { label: 'Hang the map in the village', result: 'Every traveler can now find a way home by moonlight.' },
      { label: 'Take the map on a new voyage', result: 'A fresh route appears on the map. Another adventure is waiting.' },
    ],
  },
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
  { name: 'Blossom Field', hint: 'Find the first paper star, a blue gem, and a clothing treasure.', blocked: [8, 16, 23, 26], gem: 30, chest: 19, garment: GARMENTS[0], theme: 'blossom', clue: 11, clueText: 'The paper star says: “The map was carried across the cloud bridge.”' },
  { name: 'Cloud Crossing', hint: 'Cross the cloud bridge and search for the torn map corner.', blocked: [14, 15, 16, 17, 18, 19, 20], gem: 29, chest: 10, garment: GARMENTS[1], theme: 'cloud', clue: 24, clueText: 'A cloud keeper whispers: “I heard a bell below the brook.”' },
  { name: 'Glitter Brook', hint: 'Find out why the brook has fallen silent.', blocked: [14, 15, 16, 17, 18, 19, 20, 8, 9], gem: 31, chest: 2, garment: GARMENTS[2], theme: 'brook', clue: 11, clueText: 'A fish points toward a silver bell beneath the water.' },
  { name: 'Velvet Valley', hint: 'Listen for the bell beyond the winding path.', blocked: [14, 15, 16, 17, 18, 19, 20, 11, 12, 25], gem: 30, chest: 4, garment: GARMENTS[3], theme: 'velvet', clue: 24, clueText: 'The bell calls: “Find the star that is falling upward.”' },
  { name: 'Frosted Sky', hint: 'Follow the snow that falls upward.', blocked: [14, 15, 16, 17, 18, 19, 20, 8, 9, 10], gem: 32, chest: 3, garment: GARMENTS[4], theme: 'frost', clue: 25, clueText: 'Small pawprints in the snow lead toward the tower.' },
  { name: 'Starlight Ridge', hint: 'Discover who borrowed the stars.', blocked: [14, 15, 16, 17, 18, 19, 20, 9, 10, 11], gem: 29, chest: 1, garment: GARMENTS[5], theme: 'stars', clue: 25, clueText: 'The sky fox says: “I only wanted a light to keep me company.”' },
  { name: 'Rainbow Hollow', hint: 'Make a path for your new friend.', blocked: [14, 15, 16, 17, 18, 19, 20, 7, 8, 9], gem: 30, chest: 12, garment: GARMENTS[6], theme: 'rainbow', clue: 25, clueText: 'The fox finds the final map piece under a rainbow stone.' },
  { name: 'Moon Castle', hint: 'The last treasure waits at the castle.', blocked: [14, 15, 16, 17, 18, 19, 20, 9, 10, 11, 22, 23], gem: 31, chest: 0, garment: GARMENTS[7], theme: 'moon', clue: 25, clueText: 'The castle door reads: “A journey grows brighter when shared.”' },
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
  choices?: number[];
  stage?: Stage;
  storyBeat?: number;
}

@Component({
  selector: 'app-meadow-game',
  imports: [RouterLink],
  templateUrl: './meadow-game.html',
  styleUrl: './meadow-game.scss',
})
export class MeadowGamePage {
  protected readonly ponies = PONIES;
  protected readonly episodes = EPISODES;
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
  protected readonly storyBeat = signal(0);
  protected readonly foundClue = signal(false);
  protected readonly audioEnabled = signal(false);
  protected readonly choices = signal<readonly number[]>([]);
  protected readonly episode = computed(() => EPISODES[Math.floor(this.levelIndex() / 2)]);
  protected readonly episodeNumber = computed(() => Math.floor(this.levelIndex() / 2) + 1);
  protected readonly gemCell = computed(() => {
    const previous = this.choices()[this.episodeNumber() - 2];
    return this.levelIndex() % 2 === 0 && previous === 1
      ? BRANCH_GEMS[this.levelIndex()]
      : this.level().gem;
  });
  protected readonly storyLine = computed(() => this.episode().opening[this.storyBeat()]);
  protected readonly previousChoice = computed(() => {
    const previous = this.episodeNumber() - 2;
    const index = this.choices()[previous];
    return previous >= 0 && index !== undefined ? EPISODES[previous].choices[index].result : '';
  });
  protected readonly level = computed(() => LEVELS[this.levelIndex()]);
  protected readonly wardrobe = computed(() => GARMENTS.filter((item) => this.unlocked().includes(item.id)));
  protected readonly saved = signal<SavedGame | null>(this.readSaved());
  private spokenAudio: HTMLAudioElement | null = null;
  private soundContext: AudioContext | null = null;

  protected choosePony(pony: Pony): void {
    this.pony.set(pony);
    this.levelIndex.set(0);
    this.unlocked.set([]);
    this.equipped.set({});
    this.choices.set([]);
    this.startEpisode();
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
    this.choices.set(Array.isArray(saved.choices) ? saved.choices.filter((choice) => choice === 0 || choice === 1) : []);
    if (saved.finished) {
      this.position.set(GATE);
      this.flying.set(true);
      this.foundTreasure.set(true);
      this.stage.set('finished');
      return;
    }
    if (saved.stage === 'story') {
      this.storyBeat.set(Math.min(Math.max(saved.storyBeat ?? 0, 0), this.episode().opening.length - 1));
      this.stage.set('story');
      return;
    }
    if (saved.stage === 'choice') {
      this.foundTreasure.set(true);
      this.foundClue.set(true);
      this.stage.set('choice');
      return;
    }
    this.startLevel();
  }

  protected isBlocked(cell: number): boolean { return this.level().blocked.includes(cell); }
  protected isGem(cell: number): boolean { return cell === this.gemCell() && !this.flying(); }
  protected isChest(cell: number): boolean { return cell === this.level().chest && !this.foundTreasure(); }
  protected isGate(cell: number): boolean { return cell === GATE; }
  protected isClue(cell: number): boolean { return cell === this.level().clue && !this.foundClue(); }
  protected isPlayer(cell: number): boolean { return cell === this.position(); }
  protected isEquipped(item: Garment): boolean { return this.equipped()[item.slot] === item.id; }
  protected worn(slot: Slot): string | undefined { return this.equipped()[slot]; }

  protected cellLabel(cell: number): string {
    const location = `row ${Math.floor(cell / COLUMNS) + 1}, column ${cell % COLUMNS + 1}`;
    if (this.isPlayer(cell)) return `${this.pony()?.name} is here at ${location}`;
    if (this.isGem(cell)) return `Blue flying gem at ${location}`;
    if (this.isChest(cell)) return `Clothing treasure chest at ${location}`;
    if (this.isClue(cell)) return `Story clue at ${location}`;
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

  protected advanceStory(): void {
    if (this.storyBeat() < this.episode().opening.length - 1) {
      this.storyBeat.update((beat) => beat + 1);
      this.playNarration();
    } else {
      this.stopNarration();
      this.startLevel();
    }
  }

  protected chooseEnding(index: number): void {
    if (this.stage() !== 'choice') return;
    this.choices.update((items) => [...items.slice(0, this.episodeNumber() - 1), index]);
    this.feedback.set(this.episode().choices[index].result);
    this.playSound('choice');
    if (this.levelIndex() === LEVELS.length - 1) {
      this.stage.set('finished');
    } else {
      this.levelIndex.update((value) => value + 1);
      this.startEpisode();
    }
    this.save();
  }

  protected toggleAudio(): void {
    this.audioEnabled.update((enabled) => !enabled);
    if (this.audioEnabled()) this.playNarration();
    else this.stopNarration();
  }

  protected playNarration(): void {
    if (!this.audioEnabled()) return;
    const line = this.stage() === 'story' ? this.storyLine()
      : this.stage() === 'choice' ? this.episode().ending : this.feedback();
    if (!line) return;
    this.stopNarration();
    if (this.stage() !== 'story') { this.speakInBrowser(line); return; }
    const audio = new Audio(`audio/meadow/episode-${this.episodeNumber()}-${this.storyBeat() + 1}.mp3`);
    this.spokenAudio = audio;
    audio.addEventListener('error', () => this.speakInBrowser(line), { once: true });
    void audio.play().catch(() => this.speakInBrowser(line));
  }

  private speakInBrowser(line: string): void {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.rate = 0.92;
    utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
  }

  private stopNarration(): void {
    this.spokenAudio?.pause();
    this.spokenAudio = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  protected playAgain(): void {
    this.stopNarration();
    this.stage.set('choose');
    this.pony.set(null);
    this.levelIndex.set(0);
    this.unlocked.set([]);
    this.equipped.set({});
    this.choices.set([]);
    this.saved.set(null);
    this.feedback.set('');
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
  }

  private startEpisode(): void {
    this.storyBeat.set(0);
    this.stage.set('story');
    this.feedback.set('');
    this.save();
    this.playNarration();
  }

  private playSound(kind: 'gem' | 'treasure' | 'clue' | 'gate' | 'choice'): void {
    if (!this.audioEnabled()) return;
    try {
      this.soundContext ??= new AudioContext();
      const context = this.soundContext;
      const notes = {
        gem: [660, 880], treasure: [440, 660, 880], clue: [520, 650],
        gate: [392, 523, 659, 784], choice: [523, 659, 784],
      }[kind];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.11;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.07, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.23);
      });
    } catch { /* Audio is optional. */ }
  }

  private startLevel(): void {
    this.position.set(START);
    this.flying.set(false);
    this.foundTreasure.set(false);
    this.foundClue.set(false);
    this.feedback.set('Find the blue gem, discover the clue and clothing treasure, then reach the rainbow gate.');
    this.stage.set('playing');
    this.save();
  }

  private stepTo(cell: number): void {
    this.position.set(cell);
    if (this.isGem(cell)) {
      this.flying.set(true);
      this.feedback.set('Blue gem found! Your wings can fly over clouds for this level.');
      this.playSound('gem');
    } else if (this.isChest(cell)) {
      const garment = this.level().garment;
      this.foundTreasure.set(true);
      this.unlocked.update((items) => [...new Set([...items, garment.id])]);
      this.equip(garment);
      this.feedback.set(`Treasure! ${garment.name} is now in your wardrobe.`);
      this.playSound('treasure');
    } else if (this.isClue(cell)) {
      this.foundClue.set(true);
      this.feedback.set(this.level().clueText);
      this.playSound('clue');
      if (this.audioEnabled()) this.speakInBrowser(this.level().clueText);
    } else if (cell === GATE && !this.foundClue()) {
      this.feedback.set('There is still a story clue to discover before you leave.');
    } else if (cell === GATE && !this.foundTreasure()) {
      this.feedback.set('Find the clothing treasure chest before you leave this level.');
    } else if (cell === GATE) {
      this.stage.set(this.levelIndex() % 2 === 1 ? 'choice' : 'level-complete');
      this.feedback.set(this.stage() === 'choice' ? this.episode().ending : 'The rainbow gate is open!');
      this.playSound('gate');
      if (this.stage() === 'choice') this.playNarration();
      this.save();
    } else {
      this.feedback.set(this.flying() ? 'Flying! Follow the trail to the clue and treasure.' : 'Keep looking for the blue gem.');
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
      choices: [...this.choices()],
      finished: this.stage() === 'finished',
      stage: this.stage(),
      storyBeat: this.storyBeat(),
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
