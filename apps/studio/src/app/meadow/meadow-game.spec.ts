import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MeadowGamePage } from './meadow-game';

const pathTo = (start: number, goal: number, puddles: Set<number>): number[] => {
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
      if (visited.has(neighbour) || puddles.has(neighbour)) continue;
      visited.add(neighbour);
      queue.push([...path, neighbour]);
    }
  }
  throw new Error(`No path from ${start} to ${goal}`);
};

describe('Moonbeam Meadow', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeadowGamePage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('lets a player explore, collect lights, open each gate, and replay', () => {
    const fixture = TestBed.createComponent(MeadowGamePage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelectorAll('.meadow__friend')).toHaveSize(3);
    page.querySelector<HTMLButtonElement>('.meadow__friend')!.click();
    fixture.detectChanges();

    for (let level = 1; level <= 3; level++) {
      expect(page.querySelector('.meadow__board')?.getAttribute('data-level')).toBe(String(level));
      const puddles = new Set([...page.querySelectorAll<HTMLElement>('.meadow__tile.is-puddle')]
        .map((tile) => Number(tile.dataset['cell'])));
      const moveTo = (goal: number) => {
        const start = Number(page.querySelector<HTMLElement>('.meadow__tile.is-player')!.dataset['cell']);
        for (const cell of pathTo(start, goal, puddles)) {
          const tile = page.querySelector<HTMLButtonElement>(`.meadow__tile[data-cell="${cell}"]`)!;
          expect(tile.disabled).toBeFalse();
          tile.click();
          fixture.detectChanges();
        }
      };
      while (page.querySelector('.meadow__tile.is-light')) {
        const target = Number(page.querySelector<HTMLElement>('.meadow__tile.is-light')!.dataset['cell']);
        moveTo(target);
      }
      expect(page.querySelector('.meadow__score')?.textContent).toContain(`${level + 2} / ${level + 2}`);
      moveTo(6);
      expect(page.querySelector('.meadow__victory')).not.toBeNull();
      if (level < 3) {
        page.querySelector<HTMLButtonElement>('.meadow__next')!.click();
        fixture.detectChanges();
      }
    }

    expect(page.textContent).toContain('You brought the colour back.');
    page.querySelector<HTMLButtonElement>('.meadow__next')!.click();
    fixture.detectChanges();
    expect(page.querySelectorAll('.meadow__friend')).toHaveSize(3);
  });
});
