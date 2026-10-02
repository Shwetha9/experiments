import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import {
  CHAT_ENDPOINT,
  KNOWLEDGE_ENDPOINT,
  PROVIDER_FAILURE_REPLY,
} from '@shwetha/growing-human-contracts';
import { GrowingHumanPage } from './growing-human';
import { growingHumanContent } from './content/growing-human-content';
import { NASA_EPIC_ENDPOINT } from './services/earth-image.service';

describe('GrowingHumanPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrowingHumanPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function render() {
    const fixture = TestBed.createComponent(GrowingHumanPage);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function chooseAge(fixture: ReturnType<typeof render>['fixture'], el: HTMLElement) {
    el.querySelector<HTMLButtonElement>('.growing-human__option')!.click();
    fixture.detectChanges();
  }

  function sendMessage(
    fixture: ReturnType<typeof render>['fixture'],
    el: HTMLElement,
    text: string,
  ) {
    const textarea = el.querySelector<HTMLTextAreaElement>('textarea')!;
    textarea.value = text;
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('.growing-human__composer')!.dispatchEvent(
      new Event('submit'),
    );
    fixture.detectChanges();
  }

  it('starts with the age picker and a privacy notice', () => {
    const { el } = render();

    expect(el.querySelectorAll('.growing-human__option')).toHaveSize(3);
    expect(el.textContent).toContain('Please don’t share your full name, school, address');
  });

  it('links back to Studio with normal page navigation', () => {
    const { el } = render();
    const back = Array.from(el.querySelectorAll('a')).find((a) => a.textContent?.includes('Back'));

    expect(back?.getAttribute('href')).toBe('/');
  });

  it('offers starter questions in every lane', () => {
    for (const lane of growingHumanContent.laneStep.lanes) {
      expect(lane.starters?.length).withContext(lane.id).toBe(3);
    }
    const { fixture, el } = render();
    chooseAge(fixture, el);

    expect(el.querySelectorAll('.growing-human__starter').length).toBeGreaterThan(0);
    expect(el.textContent).toContain('an AI, not a counsellor');
  });

  it('opens the NASA STEAM Lab as the third activity tab', () => {
    const { fixture, el } = render();
    chooseAge(fixture, el);
    const tabs = el.querySelectorAll<HTMLButtonElement>('.growing-human__activities button');
    expect(tabs).toHaveSize(3);
    expect(tabs[2].textContent).toContain('STEAM Lab');
    tabs[2].click();
    fixture.detectChanges();
    expect(el.querySelector('app-steam-lab')).not.toBeNull();
    expect(tabs[2].getAttribute('aria-current')).toBe('page');
    http.expectOne('/api/growing-human/steam/gallery?theme=mars&page=1')
      .flush({ theme: 'mars', page: 1, images: [] });
  });

  it('sends the chat to the BFF and renders the reply', () => {
    const { fixture, el } = render();
    chooseAge(fixture, el);
    sendMessage(fixture, el, 'How can I be a good friend?');

    const req = http.expectOne(CHAT_ENDPOINT);
    expect(req.request.body.messages.at(-1)).toEqual({
      role: 'child',
      text: 'How can I be a good friend?',
    });
    req.flush({ text: 'Listen closely.', action: 'Ask one question today.' });
    fixture.detectChanges();

    expect(el.querySelector('.growing-human__message--guide')?.textContent).toContain(
      'Listen closely.',
    );
    expect(el.querySelector('.growing-human__action')?.textContent).toContain(
      'Ask one question today.',
    );
  });

  it('shows the signed-off failure reply instead of faking an answer', () => {
    const { fixture, el } = render();
    chooseAge(fixture, el);
    sendMessage(fixture, el, 'Hello');
    http.expectOne(CHAT_ENDPOINT).flush('limit', { status: 429, statusText: 'Too Many' });
    fixture.detectChanges();

    expect(el.querySelector('.growing-human__message--guide')?.textContent).toContain(
      PROVIDER_FAILURE_REPLY.text,
    );
  });

  it('never persists the conversation in browser storage', () => {
    const local = spyOn(localStorage, 'setItem');
    const session = spyOn(sessionStorage, 'setItem');
    const { fixture, el } = render();
    chooseAge(fixture, el);
    sendMessage(fixture, el, 'Secret');
    http.expectOne(CHAT_ENDPOINT).flush({ text: 'ok' });

    expect(local).not.toHaveBeenCalled();
    expect(session).not.toHaveBeenCalled();
  });

  it('lets a child explore, quiz themselves, and open the knowledge explorer', () => {
    const local = spyOn(localStorage, 'setItem');
    const { fixture, el } = render();
    chooseAge(fixture, el);
    Array.from(
      el.querySelectorAll<HTMLButtonElement>('.growing-human__activities button'),
    )[1].click();
    fixture.detectChanges();
    http
      .expectOne(NASA_EPIC_ENDPOINT)
      .flush([{ image: 'epic_1b_20260928000000', date: '2026-09-28 00:00:00' }]);
    http.expectOne(`${KNOWLEDGE_ENDPOINT}?category=surprise`).flush({
      category: 'surprise',
      kind: 'fact',
      text: 'Octopuses have three hearts.',
      source: 'api-ninjas',
    });
    fixture.detectChanges();

    const discovery = el.querySelector('.growing-human__discovery')!;
    expect(discovery.children[1].tagName).toBe('APP-KNOWLEDGE-SCOUT');
    expect(discovery.children[2].classList).toContain('growing-human__discovery-pair');
    expect(discovery.querySelector('h1')?.textContent).toContain('What will you discover?');
    expect(el.textContent).toContain('The Moon has a familiar face.');
    expect(el.textContent).toContain('Latest available image: 2026-09-28');
    expect(el.querySelector<HTMLAnchorElement>('.earth a')?.href).toBe(
      'https://epic.gsfc.nasa.gov/?date=2026-09-28',
    );
    expect(el.querySelector<HTMLAnchorElement>('.growing-human__fact a')?.href).toContain(
      'science.nasa.gov',
    );
    expect(
      el.querySelector<HTMLButtonElement>('.growing-human__fact .growing-human__shuffle')
        ?.ariaLabel,
    ).toBe('Shuffle discovery');
    expect(el.querySelector('.growing-human__quiz .growing-human__shuffle')).toBeNull();
    expect(el.querySelector('.growing-human__discovery-pair')?.children[0].classList).toContain(
      'growing-human__fact',
    );
    expect(el.querySelector('.growing-human__discovery-pair')?.children[1].classList).toContain(
      'growing-human__quiz',
    );
    el.querySelectorAll<HTMLButtonElement>('.growing-human__answers button')[1].click();
    fixture.detectChanges();
    expect(el.querySelector('.growing-human__quiz-feedback')?.textContent).toContain('You got it!');

    expect(el.querySelector('.scout__idea')?.textContent).toContain('Octopuses have three hearts.');
    expect(el.querySelector<HTMLAnchorElement>('.scout__open')?.getAttribute('href')).toBe(
      '/discover',
    );
    expect(local).not.toHaveBeenCalled();

    spyOn(Math, 'random').and.returnValue(0);
    el.querySelector<HTMLButtonElement>('.growing-human__shuffle')!.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Mars has a giant volcano.');
    expect(el.querySelector('.growing-human__quiz-feedback')).toBeNull();
  });

  it('shuffles to a different discovery and clears the previous answer', () => {
    const { fixture, el } = render();
    chooseAge(fixture, el);
    Array.from(
      el.querySelectorAll<HTMLButtonElement>('.growing-human__activities button'),
    )[1].click();
    fixture.detectChanges();
    http.expectOne(NASA_EPIC_ENDPOINT).flush([]);
    http
      .expectOne(`${KNOWLEDGE_ENDPOINT}?category=surprise`)
      .flush({
        category: 'surprise',
        kind: 'fact',
        text: 'An octopus has three hearts.',
        source: 'reviewed',
      });
    fixture.detectChanges();

    const random = spyOn(Math, 'random').and.returnValue(0.99);
    const shuffle = el.querySelector<HTMLButtonElement>('.growing-human__shuffle')!;
    shuffle.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Discovery 4 of 4');
    expect(el.textContent).not.toContain('The Moon has a familiar face.');

    el.querySelector<HTMLButtonElement>('.growing-human__answers button')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.growing-human__quiz-feedback')).not.toBeNull();

    random.and.returnValue(0);
    shuffle.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Discovery 1 of 4');
    expect(el.querySelector('.growing-human__quiz-feedback')).toBeNull();
  });

  it('keeps discoveries usable when the NASA image request fails', () => {
    const { fixture, el } = render();
    chooseAge(fixture, el);
    Array.from(
      el.querySelectorAll<HTMLButtonElement>('.growing-human__activities button'),
    )[1].click();
    fixture.detectChanges();
    http
      .expectOne(NASA_EPIC_ENDPOINT)
      .flush('unavailable', { status: 503, statusText: 'Unavailable' });
    http
      .expectOne(`${KNOWLEDGE_ENDPOINT}?category=surprise`)
      .flush('unavailable', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect(el.textContent).toContain("NASA's image isn't available just now");
    expect(el.textContent).toContain('The Moon has a familiar face.');
  });
});
