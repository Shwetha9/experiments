import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingPage } from './landing';

describe('LandingPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(LandingPage);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the portfolio sections and email invitation', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('I build ambitious web systems');
    expect(compiled.querySelectorAll('section')).toHaveSize(7);
    expect(compiled.querySelector('a[href="mailto:hello@shwetha.studio"]')).not.toBeNull();
  });

  it('orders the narrative sections: possibility, practice, leadership, beyond', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const ids = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('section[id]'),
    ).map((section) => section.id);

    expect(ids.slice(0, 4)).toEqual(['possibility', 'practice', 'leadership', 'beyond']);
  });

  it('renders the three editorial illustrations with descriptive alt text', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const images = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLImageElement>(
        '.editorial-visual img',
      ),
    );

    expect(images.map((img) => img.getAttribute('src'))).toEqual([
      '/images/hero-illustration.png',
      '/images/possibility-illustration.png',
      '/images/leadership-illustration.svg',
    ]);
    images.forEach((img) => expect(img.alt.length).toBeGreaterThan(10));
  });

  it('marks the hero illustration busy until it loads', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const hero = compiled.querySelector('.hero__visual')!;

    expect(hero.getAttribute('aria-busy')).toBe('true');
    compiled.querySelector('.hero__visual img')!.dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(hero.getAttribute('aria-busy')).toBe('false');
  });

  it('links to Growing Human with normal page navigation and to quotes in-app', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('a[href="/growing-human/"]')).toHaveSize(3);
    expect(compiled.querySelector('header a[href="/growing-human/"]')?.textContent).toContain('Growing Human');
    expect(compiled.querySelector('header a[href="/quotes"]')).toBeNull();
    expect(compiled.querySelector('#beyond a[href="/quotes"]')?.textContent).toContain('quotes');
  });

  it('opens the mobile menu and closes it after choosing a section', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = compiled.querySelector<HTMLButtonElement>('.menu-toggle')!;
    const nav = compiled.querySelector<HTMLElement>('#primary-nav')!;

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(nav.classList.contains('header-nav--open')).toBeTrue();

    nav.querySelector<HTMLAnchorElement>('a[href="#practice"]')!.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps archive material off the landing page', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).not.toMatch(/Shwetha-isms|A few poems|Morning, unhurried|Small instruction/);
  });

  it('toggles the theme through html data-theme and aria-pressed', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.theme-toggle',
    )!;
    const before = document.documentElement.dataset['theme'];

    toggle.click();
    fixture.detectChanges();

    expect(document.documentElement.dataset['theme']).not.toBe(before);
    expect(toggle.getAttribute('aria-pressed')).toBe(String(before !== 'dark'));
    toggle.click();
  });

  it('opens and closes the full passage dialog', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const dialog = compiled.querySelector<HTMLDialogElement>('dialog.quote-dialog')!;

    compiled.querySelector<HTMLButtonElement>('.influence__link')!.click();
    fixture.detectChanges();
    expect(dialog.open).toBeTrue();
    expect(dialog.textContent).toContain('No man is an island');

    dialog.querySelector<HTMLButtonElement>('.quote-dialog__close')!.click();
    fixture.detectChanges();
    expect(dialog.open).toBeFalse();
  });
});
