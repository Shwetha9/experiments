import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MeadowGamePage } from './meadow-game';

const pathTo = (start: number, goal: number, blocked: Set<number>): number[] => {
  const queue: number[][] = [[start]];
  const visited = new Set([start]);
  for (const path of queue) {
    const cell = path[path.length - 1];
    if (cell === goal) return path.slice(1);
    const row = Math.floor(cell / 7);
    const col = cell % 7;
    const next = [
      ...(row > 0 ? [cell - 7] : []),
      ...(row < 4 ? [cell + 7] : []),
      ...(col > 0 ? [cell - 1] : []),
      ...(col < 6 ? [cell + 1] : []),
    ];
    for (const neighbour of next) {
      if (visited.has(neighbour) || blocked.has(neighbour)) continue;
      visited.add(neighbour);
      queue.push([...path, neighbour]);
    }
  }
  throw new Error(`No path from ${start} to ${goal}`);
};

describe('Moonbeam Meadow', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MeadowGamePage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('plays four story episodes, requires a gem and clue, unlocks clothing, and saves choices', () => {
    const fixture = TestBed.createComponent(MeadowGamePage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelectorAll('.meadow__friend')).toHaveSize(3);
    page.querySelector<HTMLButtonElement>('.meadow__friend')!.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('The Map That Vanished');
    for (let scene = 0; scene < 2; scene++) {
      page.querySelector<HTMLButtonElement>('.meadow__story-actions .meadow__next')!.click();
      fixture.detectChanges();
    }

    for (let level = 1; level <= 8; level++) {
      expect(page.querySelector('.meadow__board')?.getAttribute('data-level')).toBe(String(level));
      const blocked = new Set([...page.querySelectorAll<HTMLElement>('.meadow__tile.is-blocked')]
        .map((tile) => Number(tile.dataset['cell'])));
      const moveTo = (goal: number, obstacles: Set<number>) => {
        const start = Number(page.querySelector<HTMLElement>('.meadow__tile.is-player')!.dataset['cell']);
        for (const cell of pathTo(start, goal, obstacles)) {
          const tile = page.querySelector<HTMLButtonElement>(`.meadow__tile[data-cell="${cell}"]`)!;
          expect(tile.disabled).toBeFalse();
          tile.click();
          fixture.detectChanges();
        }
      };
      const gem = Number(page.querySelector<HTMLElement>('.meadow__tile.is-gem')!.dataset['cell']);
      const chest = Number(page.querySelector<HTMLElement>('.meadow__tile.is-chest')!.dataset['cell']);
      if (level === 2) {
        expect([...page.querySelectorAll<HTMLButtonElement>('.meadow__tile.is-blocked')]
          .every((tile) => tile.disabled)).toBeTrue();
      }
      moveTo(gem, blocked);
      expect(page.textContent).toContain('Flying!');
      if (level === 2) {
        moveTo(21, new Set());
        expect(page.querySelector<HTMLButtonElement>('.meadow__tile[data-cell="14"]')!.disabled).toBeFalse();
      }
      const clue = Number(page.querySelector<HTMLElement>('.meadow__tile.is-clue')!.dataset['cell']);
      moveTo(clue, new Set());
      expect(page.textContent).toContain('Story clue found!');
      moveTo(chest, new Set());
      expect(page.querySelectorAll('.meadow__clothing')).toHaveSize(level);
      expect(page.querySelector('.meadow__clothing.is-worn')).not.toBeNull();
      moveTo(6, new Set());
      expect(page.querySelector(level % 2 === 0 ? '.meadow__decision' : '.meadow__victory')).not.toBeNull();
      if (level < 8) {
        page.querySelector<HTMLButtonElement>(level % 2 === 0 ? '.meadow__decision-options button' : '.meadow__next')!.click();
        fixture.detectChanges();
        if (level % 2 === 0) {
          expect(page.querySelector('.meadow__story')).not.toBeNull();
          for (let scene = 0; scene < 2; scene++) {
            page.querySelector<HTMLButtonElement>('.meadow__story-actions .meadow__next')!.click();
            fixture.detectChanges();
          }
        }
      }
    }
    page.querySelector<HTMLButtonElement>('.meadow__decision-options button')!.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('All eight treasures found');
    expect(page.querySelectorAll('.meadow__clothing')).toHaveSize(8);
    expect(localStorage.getItem('moonbeam-meadow-v2')).toContain('"finished":true');
    expect(localStorage.getItem('moonbeam-meadow-v2')).toContain('"choices":[0,0,0,0]');
  });

  it('lets the player return to their saved pony and level', () => {
    localStorage.setItem('moonbeam-meadow-v2', JSON.stringify({
      pony: 'Clover', levelIndex: 3, unlocked: ['rose-cape'], equipped: { cape: 'rose-cape' },
    }));
    const fixture = TestBed.createComponent(MeadowGamePage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLButtonElement>('.meadow__resume')!.click();
    fixture.detectChanges();
    expect(page.querySelector('.meadow__board')?.getAttribute('data-level')).toBe('4');
    expect(page.textContent).toContain("Clover's adventure");
    expect(page.querySelector('.meadow__outfit')?.getAttribute('data-cape')).toBe('rose-cape');
  });

  it('resumes an episode at its saved story scene', () => {
    localStorage.setItem('moonbeam-meadow-v2', JSON.stringify({
      pony: 'Miso', levelIndex: 4, stage: 'story', storyBeat: 1,
      unlocked: ['rose-cape'], equipped: { cape: 'rose-cape' }, choices: [1, 0],
    }));
    const fixture = TestBed.createComponent(MeadowGamePage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLButtonElement>('.meadow__resume')!.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('The Tower of Borrowed Stars');
    expect(page.textContent).toContain('A winged pony can cross the clouds');
    expect(page.querySelector('.meadow__story-art img')?.getAttribute('src')).toContain('miso-winged.png');
  });

  it('keeps board cells square and the pony inside its cell', () => {
    const fixture = TestBed.createComponent(MeadowGamePage);
    document.body.appendChild(fixture.nativeElement);
    try {
      fixture.detectChanges();
      const page = fixture.nativeElement as HTMLElement;
      page.querySelector<HTMLButtonElement>('.meadow__friend')!.click();
      fixture.detectChanges();
      for (let scene = 0; scene < 2; scene++) {
        page.querySelector<HTMLButtonElement>('.meadow__story-actions .meadow__next')!.click();
        fixture.detectChanges();
      }
      const tile = page.querySelector<HTMLElement>('.meadow__tile')!.getBoundingClientRect();
      const pony = page.querySelector<HTMLElement>('.meadow__player')!.getBoundingClientRect();
      const rainbow = page.querySelector<HTMLElement>('.meadow__gate')!.getBoundingClientRect();
      expect(tile.width).toBeGreaterThan(0);
      expect(Math.abs(tile.width - tile.height)).toBeLessThan(2);
      expect(pony.width).toBeLessThan(tile.width);
      expect(pony.height).toBeLessThan(tile.height);
      expect(rainbow.width).toBeGreaterThan(rainbow.height);
    } finally {
      fixture.destroy();
    }
  });
});
