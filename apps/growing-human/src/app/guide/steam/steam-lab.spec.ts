import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { STEAM_GALLERY_ENDPOINT, STEAM_MISSION_ENDPOINT } from '@shwetha/growing-human-contracts';
import { SteamLabPage } from './steam-lab';

const images = [
  { id: 'PIA08712', title: 'Rover Tracks', thumbnailUrl: 'https://images-assets.nasa.gov/one.jpg', sourceUrl: 'https://images.nasa.gov/details/PIA08712', date: '2007-01-01' },
  { id: 'PIA13081', title: 'Martian Horizon', thumbnailUrl: 'https://images-assets.nasa.gov/two.jpg', sourceUrl: 'https://images.nasa.gov/details/PIA13081', date: null },
];

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

  it('uses NASA images and sends only fixed selections to the mission maker', () => {
    const fixture = TestBed.createComponent(SteamLabPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('.lab__age-options button')!.click();
    fixture.detectChanges();
    http.expectOne(`${STEAM_GALLERY_ENDPOINT}?theme=mars&page=1`)
      .flush({ theme: 'mars', page: 1, images });
    fixture.detectChanges();
    expect(el.querySelectorAll('.lab__filmstrip button')).toHaveSize(2);

    el.querySelector<HTMLButtonElement>('.lab__make')!.click();
    fixture.detectChanges();
    const call = http.expectOne(STEAM_MISSION_ENDPOINT);
    expect(call.request.body).toEqual({
      ageBand: '7-10', theme: 'mars', page: 1, imageId: 'PIA08712',
      lens: 'science', notice: 'pattern', remix: 0,
    });
    call.flush({
      title: 'A new mission', challenge: 'Look for tracks in this NASA image.',
      action: 'Draw two paths on paper.', question: 'Which path might be easier to follow?', source: 'ai',
    });
    fixture.detectChanges();
    expect(el.textContent).toContain('A new mission');
    el.querySelector<HTMLButtonElement>('.lab__mission-actions button:last-child')!.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Your mission trail');
  });
});
