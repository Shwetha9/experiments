import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { STEAM_QUESTION_ENDPOINT } from '@shwetha/growing-human-contracts';
import { SteamLabPage } from './steam-lab';

describe('SteamLabPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SteamLabPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lets a child choose an age, predict, and see a fixed explanation', () => {
    const fixture = TestBed.createComponent(SteamLabPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.lab__age-options button')).toHaveSize(3);
    el.querySelector<HTMLButtonElement>('.lab__age-options button')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.lab__missions button')).toHaveSize(5);
    el.querySelector<HTMLButtonElement>('.lab__choices button')!.click();
    fixture.detectChanges();
    const call = http.expectOne(STEAM_QUESTION_ENDPOINT);
    expect(call.request.body).toEqual({ ageBand: '7-10', missionId: 'shadow', choiceId: 'bigger' });
    expect(el.textContent).toContain('The light spreads out from the torch');
    call.flush({ question: 'What might you try next?', source: 'curated' });
    fixture.detectChanges();
    expect(el.textContent).toContain('What might you try next?');
    expect(el.textContent).toContain('1 of 5 explored');
  });
});
