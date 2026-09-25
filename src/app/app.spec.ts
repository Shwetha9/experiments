import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the portfolio sections and email invitation', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('I build ambitious web systems');
    expect(compiled.querySelectorAll('section')).toHaveSize(9);
    expect(compiled.querySelector('a[href="mailto:hello@shwetha.studio"]')).not.toBeNull();
  });

  it('renders three purposeful editorial illustrations', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const illustrations = compiled.querySelectorAll<HTMLImageElement>('[data-editorial-illustration]');

    expect(illustrations).toHaveSize(3);
    expect(illustrations[0].alt).toContain('Shwetha');
    expect(illustrations[1].alt).toContain('systems');
    expect(illustrations[2].alt).toContain('AI');
  });
});
