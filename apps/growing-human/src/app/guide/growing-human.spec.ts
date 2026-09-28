import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CHAT_ENDPOINT, PROVIDER_FAILURE_REPLY } from '@shwetha/growing-human-contracts';
import { GrowingHumanPage } from './growing-human';
import { growingHumanContent } from './content/growing-human-content';

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

  function sendMessage(fixture: ReturnType<typeof render>['fixture'], el: HTMLElement, text: string) {
    const textarea = el.querySelector<HTMLTextAreaElement>('textarea')!;
    textarea.value = text;
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('.growing-human__composer')!.dispatchEvent(new Event('submit'));
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
      expect(lane.starters?.length).withContext(lane.id).toBeGreaterThan(0);
    }
    const { fixture, el } = render();
    chooseAge(fixture, el);

    expect(el.querySelectorAll('.growing-human__starter').length).toBeGreaterThan(0);
    expect(el.textContent).toContain('an AI, not a counsellor');
  });

  it('sends the chat to the BFF and renders the reply', () => {
    const { fixture, el } = render();
    chooseAge(fixture, el);
    sendMessage(fixture, el, 'How can I be a good friend?');

    const req = http.expectOne(CHAT_ENDPOINT);
    expect(req.request.body.messages.at(-1)).toEqual({ role: 'child', text: 'How can I be a good friend?' });
    req.flush({ text: 'Listen closely.', action: 'Ask one question today.' });
    fixture.detectChanges();

    expect(el.querySelector('.growing-human__message--guide')?.textContent).toContain('Listen closely.');
    expect(el.querySelector('.growing-human__action')?.textContent).toContain('Ask one question today.');
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
});
