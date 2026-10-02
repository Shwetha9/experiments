import { BadRequestException } from '@nestjs/common';
import { SteamLabService } from './steam-lab.service';
import { SteamGalleryService } from './steam-gallery.service';
import { OpenRouterClient } from './provider/openrouter.client';

const request = {
  ageBand: '11-13' as const,
  theme: 'mars' as const,
  page: 1,
  imageId: 'PIA08712',
  lens: 'engineering' as const,
  notice: 'pattern' as const,
  remix: 0,
};
const gallery = {
  get: jest.fn().mockResolvedValue({
    theme: 'mars', page: 1,
    images: [{ id: 'PIA08712', title: 'Rover Tracks on Mars', thumbnailUrl: '', sourceUrl: '', date: null }],
  }),
} as unknown as SteamGalleryService;
const draft = JSON.stringify({
  title: 'Tracks and treads',
  challenge: 'Look at the rover tracks and imagine a wheel for this landscape.',
  action: 'Sketch two wheel tread patterns on paper and compare how each might grip.',
  question: 'What could you test to decide which tread works better?',
});
const provider = (overrides: Record<string, unknown> = {}): OpenRouterClient => ({
  steamAiEnabled: true,
  completeSteamMission: jest.fn().mockResolvedValue(draft),
  classifySteamMission: jest.fn().mockResolvedValue({ decision: 'release', confident: true }),
  ...overrides,
}) as unknown as OpenRouterClient;

describe('SteamLabService', () => {
  it('uses a clearly labelled starter when AI credentials or review are unavailable', async () => {
    const client = provider({ steamAiEnabled: false });
    const result = await new SteamLabService(gallery, client).mission(request);
    expect(result.source).toBe('starter');
    expect(result.challenge).toContain('Rover Tracks on Mars');
    expect(client.completeSteamMission).not.toHaveBeenCalled();
  });

  it.each([
    { ...request, lens: 'unknown' },
    { ...request, notice: 'unknown' },
    { ...request, ageBand: 'adult' },
    { ...request, remix: 51 },
  ])('rejects unsupported selections before contacting NASA or AI', async (invalid) => {
    const client = provider();
    await expect(new SteamLabService(gallery, client).mission(invalid as typeof request))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(client.completeSteamMission).not.toHaveBeenCalled();
  });

  it('refuses an image that was not returned by the selected NASA gallery', async () => {
    const client = provider();
    await expect(new SteamLabService(gallery, client).mission({ ...request, imageId: 'FAKE' }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses only NASA metadata and fixed selections in the AI prompt', async () => {
    const client = provider();
    await expect(new SteamLabService(gallery, client).mission(request)).resolves.toMatchObject({
      title: 'Tracks and treads', source: 'ai',
    });
    const [system, user] = (client.completeSteamMission as jest.Mock).mock.calls[0];
    expect(system).toContain('No personal information');
    expect(JSON.parse(user)).toMatchObject({
      nasaImageTitle: 'Rover Tracks on Mars', lens: 'Engineering', noticed: 'Pattern',
    });
    expect(JSON.parse(user)).not.toHaveProperty('messages');
  });

  it('tries one different mission when the first AI answer is unusable', async () => {
    const completeSteamMission = jest.fn()
      .mockResolvedValueOnce('not json')
      .mockResolvedValueOnce(draft);
    const client = provider({ completeSteamMission });
    await expect(new SteamLabService(gallery, client).mission(request))
      .resolves.toMatchObject({ title: 'Tracks and treads', source: 'ai' });
    expect(completeSteamMission).toHaveBeenCalledTimes(2);
    expect(JSON.parse(completeSteamMission.mock.calls[1][1]).variation).toBe(1);
  });

  it.each([
    [{ completeSteamMission: jest.fn().mockResolvedValue('not json') }],
    [{ classifySteamMission: jest.fn().mockResolvedValue({ decision: 'block', confident: true }) }],
    [{ classifySteamMission: jest.fn().mockResolvedValue({ decision: 'release', confident: false }) }],
  ])('falls back when output is malformed or Jev does not release it', async (override) => {
    await expect(new SteamLabService(gallery, provider(override)).mission(request))
      .resolves.toMatchObject({ source: 'starter' });
  });
});
