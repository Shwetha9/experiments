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

  it('requires a gem to fly, unlocks clothing in eight levels, and saves progress', () => {
    const fixture = TestBed.createComponent(MeadowGamePage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelectorAll('.meadow__friend')).toHaveSize(3);
    page.querySelector<HTMLButtonElement>('.meadow__friend')!.click();
    fixture.detectChanges();

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
      moveTo(chest, new Set());
      expect(page.querySelectorAll('.meadow__clothing')).toHaveSize(level);
      expect(page.querySelector('.meadow__clothing.is-worn')).not.toBeNull();
      moveTo(6, new Set());
      expect(page.querySelector('.meadow__victory')).not.toBeNull();
      if (level < 8) {
        page.querySelector<HTMLButtonElement>('.meadow__next')!.click();
        fixture.detectChanges();
      }
    }
    expect(page.textContent).toContain('All eight treasures found');
    expect(page.querySelectorAll('.meadow__clothing')).toHaveSize(8);
    expect(localStorage.getItem('moonbeam-meadow-v2')).toContain('"finished":true');
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
});
