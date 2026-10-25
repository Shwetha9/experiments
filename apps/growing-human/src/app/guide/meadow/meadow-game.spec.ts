import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MeadowGamePage } from './meadow-game';

describe('Moonbeam Meadow', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeadowGamePage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('lets a child complete and replay all three interactive chapters', fakeAsync(() => {
    const fixture = TestBed.createComponent(MeadowGamePage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLButtonElement>('.meadow__friend')!.click();
    fixture.detectChanges();

    const rhythm = [...page.querySelectorAll('.meadow__sequence-flower')]
      .map((flower) => flower.textContent!.trim());
    expect(rhythm).toHaveSize(4);
    tick(4200);
    fixture.detectChanges();
    for (const icon of rhythm) {
      const flower = [...page.querySelectorAll<HTMLButtonElement>('.meadow__flower-buttons button')]
        .find((button) => button.textContent!.trim() === icon)!;
      flower.click();
      fixture.detectChanges();
    }
    expect(page.textContent).toContain('You remembered the whole flower rhythm!');
    page.querySelector<HTMLButtonElement>('.meadow__next')!.click();
    fixture.detectChanges();

    const target = page.querySelector('.meadow__help strong')!.textContent!.trim();
    const choices: Record<string, string[]> = {
      peach: ['Rose pink', 'Sun yellow'],
      'leaf green': ['Sun yellow', 'Sky blue'],
      lavender: ['Rose pink', 'Sky blue'],
    };
    for (const label of choices[target]) {
      [...page.querySelectorAll<HTMLButtonElement>('.meadow__paint')]
        .find((button) => button.textContent!.includes(label))!.click();
      fixture.detectChanges();
    }
    expect(page.textContent).toContain('A colour spark is yours.');
    page.querySelector<HTMLButtonElement>('.meadow__next')!.click();
    fixture.detectChanges();

    for (let stone = 1; stone <= 5; stone++) {
      page.querySelector<HTMLButtonElement>(`.meadow__stone[aria-label="Stone ${stone}"]`)!.click();
      fixture.detectChanges();
    }
    page.querySelector<HTMLButtonElement>('.meadow__next')!.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('You did it, meadow keeper!');
    expect(page.querySelectorAll('.meadow__progress .is-lit')).toHaveSize(3);
    page.querySelector<HTMLButtonElement>('.meadow__next')!.click();
    fixture.detectChanges();
    expect(page.querySelectorAll('.meadow__friend')).toHaveSize(3);
  }));
});
