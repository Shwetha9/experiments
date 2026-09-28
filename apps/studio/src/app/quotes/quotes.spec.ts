import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { QuotesPage } from './quotes';

describe('QuotesPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.removeItem('studio.quotes.saved');
    await TestBed.configureTestingModule({
      imports: [QuotesPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('studio.quotes.saved');
  });

  function render() {
    const fixture = TestBed.createComponent(QuotesPage);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('loads the quote of the day through the server proxy', () => {
    const { fixture, el } = render();
    http
      .expectOne('/api/quotes/quoteoftheday')
      .flush([{ quote: 'Stay curious.', author: 'Ada', categories: ['wisdom'] }]);
    fixture.detectChanges();

    expect(el.querySelector('#daily blockquote')?.textContent).toContain('Stay curious.');
    expect(el.querySelector('#daily .quote-attribution')?.textContent).toContain('Ada');
  });

  it('falls back to a personal quote when the provider fails', () => {
    const { fixture, el } = render();
    http.expectOne('/api/quotes/quoteoftheday').flush('down', { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(el.querySelector('#daily blockquote')?.textContent).toContain('No man is an island');
  });

  it('header links stay on /quotes and target each section in page order', () => {
    const { el } = render();
    http.expectOne('/api/quotes/quoteoftheday').flush([]);
    const hrefs = Array.from(
      el.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Quotes navigation"] a'),
    ).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual([
      '/',
      '/quotes#daily',
      '/quotes#browse',
      '/quotes#anchors',
      '/quotes#saved',
    ]);
  });

  it('keeps sections in order: daily, browse, anchors, saved', () => {
    const { el } = render();
    http.expectOne('/api/quotes/quoteoftheday').flush([]);
    const ids = Array.from(el.querySelectorAll('section[id]')).map((s) => s.id);

    expect(ids).toEqual(['daily', 'browse', 'anchors', 'saved']);
  });

  it('saves a quote to the shelf, persists it, and removes it again', () => {
    const { fixture, el } = render();
    http
      .expectOne('/api/quotes/quoteoftheday')
      .flush([{ quote: 'Stay curious.', author: 'Ada', categories: ['wisdom'] }]);
    fixture.detectChanges();
    expect(el.querySelectorAll('#saved article').length).toBe(0);

    const save = el.querySelector<HTMLButtonElement>('#daily .quote-actions button')!;
    save.click();
    fixture.detectChanges();

    expect(save.getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector('#saved article')?.textContent).toContain('Stay curious.');
    expect(localStorage.getItem('studio.quotes.saved')).toContain('Stay curious.');

    save.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('#saved article').length).toBe(0);
  });

  it('marks the selected category and requests a random quote for it', () => {
    const { fixture, el } = render();
    http.expectOne('/api/quotes/quoteoftheday').flush([]);
    const buttons = el.querySelectorAll<HTMLButtonElement>('.category-controls button');
    buttons[1].click();
    fixture.detectChanges();

    const req = http.expectOne((r) => r.url === '/api/quotes/randomquotes');
    expect(req.request.params.get('categories')).toBe(buttons[1].textContent!.trim());
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    req.flush([{ quote: 'Q', author: 'A', categories: [] }]);
  });

  it('shows a loading state while browsing, then local fallbacks on error', () => {
    const { fixture, el } = render();
    http.expectOne('/api/quotes/quoteoftheday').flush([]);
    el.querySelector<HTMLButtonElement>('.browse__actions .text-link')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.browse__loading')).not.toBeNull();

    http.expectOne((r) => r.url === '/api/quotes/quotes').flush('x', { status: 500, statusText: 'E' });
    fixture.detectChanges();
    expect(el.querySelector('.browse__loading')).toBeNull();
    expect(el.querySelectorAll('.browse__results article').length).toBeGreaterThan(0);
  });

  it('renders the three personal anchors', () => {
    const { el } = render();
    http.expectOne('/api/quotes/quoteoftheday').flush([]);
    const text = el.querySelector('#anchors')?.textContent ?? '';

    for (const author of ['John Donne', 'Nathaniel Hawthorne', 'Leonard Cohen']) {
      expect(text).toContain(author);
    }
  });
});
