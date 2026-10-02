import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { SteamGalleryService } from './steam-gallery.service';

const nasaPayload = {
  collection: { items: [
    { data: [{ nasa_id: 'PIA08712', title: 'Rover Tracks', date_created: '2007-01-01T00:00:00Z' }],
      links: [{ render: 'image', href: 'https://images-assets.nasa.gov/image/PIA08712/PIA08712~small.jpg' }] },
    { data: [{ nasa_id: 'BAD', title: 'Unexpected' }],
      links: [{ render: 'image', href: 'https://example.com/not-nasa.jpg' }] },
  ] },
};

describe('SteamGalleryService', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  it('fetches a curated NASA search, filters unsafe URLs and caches the gallery', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, json: async () => nasaPayload,
    }) as unknown as typeof fetch;
    const service = new SteamGalleryService();
    const first = await service.get('mars', 1);
    expect(first.images).toHaveLength(1);
    expect(first.images[0]).toMatchObject({
      id: 'PIA08712', title: 'Rover Tracks', sourceUrl: 'https://images.nasa.gov/details/PIA08712',
    });
    expect(String((global.fetch as jest.Mock).mock.calls[0][0])).toContain('q=mars+rover+landscape');
    await service.get('mars', 1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects arbitrary searches and out-of-range pages', async () => {
    const service = new SteamGalleryService();
    await expect(service.get('unsafe' as 'mars', 1)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.get('mars', 0)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns a retryable error when NASA is unavailable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    await expect(new SteamGalleryService().get('moon', 1))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
