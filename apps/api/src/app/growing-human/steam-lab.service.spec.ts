import { BadRequestException } from '@nestjs/common';
import { SteamLabService } from './steam-lab.service';
import { OpenRouterClient } from './provider/openrouter.client';

const request = { ageBand: '11-13' as const, missionId: 'shadow', choiceId: 'bigger' };
const provider = (overrides: Record<string, unknown> = {}): OpenRouterClient => ({
  steamAiEnabled: true,
  completeSteamQuestion: jest.fn().mockResolvedValue('What might happen if the toy moves closer to the wall?'),
  classifySteamQuestion: jest.fn().mockResolvedValue({ decision: 'release', confident: true }),
  ...overrides,
}) as unknown as OpenRouterClient;

describe('SteamLabService', () => {
  it('returns the curated question without calling AI when its separate gate is off', async () => {
    const client = provider({ steamAiEnabled: false });
    await expect(new SteamLabService(client).question(request)).resolves.toEqual({
      question: 'What might change if you move the toy closer to the wall instead?',
      source: 'curated',
    });
    expect(client.completeSteamQuestion).not.toHaveBeenCalled();
  });

  it.each([
    { ...request, missionId: 'unknown' },
    { ...request, choiceId: 'unknown' },
    { ...request, ageBand: 'adult' },
  ])('rejects unsupported IDs before contacting AI', async (invalid) => {
    const client = provider();
    await expect(new SteamLabService(client).question(invalid as typeof request))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(client.completeSteamQuestion).not.toHaveBeenCalled();
  });

  it('passes only fixed mission text and the selected option to the model', async () => {
    const client = provider();
    await expect(new SteamLabService(client).question(request)).resolves.toMatchObject({ source: 'ai' });
    const [system, user] = (client.completeSteamQuestion as jest.Mock).mock.calls[0];
    expect(system).toContain('Do not ask for personal details');
    expect(JSON.parse(user)).toMatchObject({ ageBand: '11-13', field: 'Science', prediction: 'It gets bigger' });
    expect(JSON.parse(user)).not.toHaveProperty('messages');
  });

  it.each([
    ['malformed format', { completeSteamQuestion: jest.fn().mockResolvedValue('Here is a fact.') }],
    ['provider failure', { completeSteamQuestion: jest.fn().mockResolvedValue(null) }],
    ['Jev block', { classifySteamQuestion: jest.fn().mockResolvedValue({ decision: 'block', confident: true }) }],
    ['low confidence', { classifySteamQuestion: jest.fn().mockResolvedValue({ decision: 'release', confident: false }) }],
  ])('uses the curated fallback for %s', async (_name, override) => {
    await expect(new SteamLabService(provider(override)).question(request)).resolves.toMatchObject({ source: 'curated' });
  });
});
