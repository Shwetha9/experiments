import { ConfigService } from '@nestjs/config';
import { OpenRouterClient } from './openrouter.client';

describe('OpenRouterClient STEAM review', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  it('passes NASA title to Jev and accepts a clear release with low block probability', async () => {
    const config = { get: (key: string) => ({
      OPENROUTER_API_KEY: 'test-key', OPENROUTER_JEV_MODEL: 'test-jev',
    } as Record<string, string>)[key] } as ConfigService;
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      answers: { decision: { type: 'choice', choice: 'release', confidence: 0.59,
        probabilities: { release: 0.73, rewrite: 0.27, block: 0 } } },
    }), { status: 200 })) as typeof fetch;

    const result = await new OpenRouterClient(config)
      .classifySteamMission('{"title":"Draw rover tracks"}', 'Rover Tracks on Mars');

    expect(result).toEqual({ decision: 'release', confident: true });
    const request = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(request.state).toEqual({
      candidate: '{"title":"Draw rover tracks"}', nasaImageTitle: 'Rover Tracks on Mars',
    });
  });

  it('does not release uncertain output', async () => {
    const config = { get: (key: string) => ({
      OPENROUTER_API_KEY: 'test-key', OPENROUTER_JEV_MODEL: 'test-jev',
    } as Record<string, string>)[key] } as ConfigService;
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      answers: { decision: { type: 'choice', choice: 'release', confidence: 0.9,
        probabilities: { release: 0.6, rewrite: 0.3, block: 0.1 } } },
    }), { status: 200 })) as typeof fetch;

    await expect(new OpenRouterClient(config).classifySteamMission('{}', 'Moon surface'))
      .resolves.toEqual({ decision: 'release', confident: false });
  });
});

describe('OpenRouterClient guide answer', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  it('requires a structured answer from the chat model', async () => {
    const config = { get: (key: string) => ({
      OPENROUTER_API_KEY: 'test-key', OPENROUTER_CHAT_MODEL: 'test-chat',
    } as Record<string, string>)[key] } as ConfigService;
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '{"answer":"A","question":"Why?","action":""}' } }],
    }), { status: 200 })) as typeof fetch;

    await expect(new OpenRouterClient(config).completeGuide('system', 'user'))
      .resolves.toContain('"answer"');
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.response_format).toMatchObject({
      type: 'json_schema',
      json_schema: {
        strict: true,
        schema: { required: ['answer', 'question', 'action'], additionalProperties: false },
      },
    });
  });
});
