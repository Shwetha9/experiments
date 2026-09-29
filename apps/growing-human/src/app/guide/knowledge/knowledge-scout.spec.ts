import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KNOWLEDGE_ENDPOINT, REVIEWED_KNOWLEDGE } from '@shwetha/growing-human-contracts';
import { KnowledgeScout } from './knowledge-scout';

describe('KnowledgeScout', () => {
  it('saves an idea without typing and keeps only six recent scouts after fifty more', async () => {
    await TestBed.configureTestingModule({
      imports: [KnowledgeScout],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const local = spyOn(localStorage, 'setItem');
    const fixture = TestBed.createComponent(KnowledgeScout);
    fixture.componentRef.setInput('full', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    http.expectOne(`${KNOWLEDGE_ENDPOINT}?category=surprise`).flush({
      category: 'surprise',
      kind: 'fact',
      text: 'An octopus has three hearts.',
      source: 'reviewed',
    });
    const select = el.querySelector<HTMLSelectElement>('#knowledge-category')!;
    select.value = 'places';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const request = http.expectOne(`${KNOWLEDGE_ENDPOINT}?category=places`);
    request.flush({
      category: 'places',
      kind: 'question',
      text: 'Which ocean is largest?',
      answer: 'The Pacific Ocean.',
      source: 'api-ninjas',
    });
    fixture.detectChanges();

    expect(el.querySelector('.scout__idea')?.textContent).toContain('Which ocean is largest?');
    el.querySelector<HTMLButtonElement>('.scout__reveal')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.scout__answer')?.textContent).toContain('The Pacific Ocean.');

    el.querySelector<HTMLButtonElement>('.scout__save')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.scout__saved-list')?.textContent).toContain(
      'Which ocean is largest?',
    );
    expect(el.querySelector('.scout__notebook')).toBeNull();

    for (let index = 0; index < 50; index++) {
      el.querySelector<HTMLButtonElement>('.scout__again')!.click();
      http.expectOne(`${KNOWLEDGE_ENDPOINT}?category=places`).flush({
        category: 'places',
        kind: 'fact',
        text: `Discovery ${index}`,
        source: 'api-ninjas',
      });
      fixture.detectChanges();
    }

    expect(el.querySelectorAll('.scout__trail .scout__items button').length).toBe(6);
    expect(el.querySelector('.scout__trail')?.textContent).toContain('Discovery 49');
    expect(el.querySelector('.scout__trail')?.textContent).not.toContain('Discovery 0');
    expect(el.querySelector('.scout__saved-list')?.textContent).toContain(
      'Which ocean is largest?',
    );
    expect(el.querySelector('.scout__saved-list h3')?.textContent).toContain('1');
    el.querySelector<HTMLButtonElement>('.scout__remove')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.scout__saved-list h3')?.textContent).toContain('0');
    expect(local).not.toHaveBeenCalled();
    http.verify();
  });

  it('stops repeating a reviewed topic after its three ideas are seen', async () => {
    await TestBed.configureTestingModule({
      imports: [KnowledgeScout],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(KnowledgeScout);
    fixture.componentRef.setInput('full', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    http.expectOne(`${KNOWLEDGE_ENDPOINT}?category=surprise`).flush(REVIEWED_KNOWLEDGE.surprise);
    fixture.detectChanges();

    for (let index = 0; index < 2; index++) {
      el.querySelector<HTMLButtonElement>('.scout__again')!.click();
      http.expectOne(`${KNOWLEDGE_ENDPOINT}?category=surprise`).flush(REVIEWED_KNOWLEDGE.surprise);
      fixture.detectChanges();
    }

    expect(el.querySelector<HTMLButtonElement>('.scout__again')?.disabled).toBeTrue();
    expect(el.querySelector('.scout__limit')?.textContent).toContain('Try another topic');
    expect(el.querySelectorAll('.scout__trail .scout__items button').length).toBe(3);
    http.verify();
  });
});
