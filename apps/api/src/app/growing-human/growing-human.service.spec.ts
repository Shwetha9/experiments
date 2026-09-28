import {
  CRISIS_REPLY,
  PREVIEW_REPLY,
  PROVIDER_FAILURE_REPLY,
  REFUSAL_REPLY,
} from '@shwetha/growing-human-contracts';
import { GrowingHumanService } from './growing-human.service';
import { GuidePromptService } from './prompt/guide-prompt.service';
import { OpenRouterClient } from './provider/openrouter.client';
import { InputSafetyService } from './safety/input-safety.service';

const request = (text: string, ageBand: '7-10' | '11-13' | '14-16' = '14-16') => ({
  ageBand,
  lane: 'anything' as const,
  messages: [{ role: 'child' as const, text }],
});

const validDraft = JSON.stringify({
  answer: 'A small plan can make the goal feel easier.',
  question: 'What is one amount you could save this week?',
  action: 'Write that amount on a note today.',
});

const sensitiveDraft = JSON.stringify({
  answer: 'It can help to share that feeling with a trusted adult who knows you.',
  question: 'What small step could make the next conversation feel easier?',
});

const providerStub = (overrides: Partial<OpenRouterClient> = {}): OpenRouterClient =>
  ({
    guideEnabled: true,
    classifyInput: jest.fn().mockResolvedValue({ category: 'ordinary', confident: true }),
    classifyOutput: jest.fn().mockResolvedValue({ decision: 'release', confident: true }),
    completeGuide: jest.fn().mockResolvedValue(validDraft),
    ...overrides,
  }) as unknown as OpenRouterClient;

const createService = (provider: OpenRouterClient): GrowingHumanService =>
  new GrowingHumanService(new InputSafetyService(), new GuidePromptService(), provider);

describe('GrowingHumanService', () => {
  it.each([
    ['I do not want to be alive', CRISIS_REPLY],
    ['Tell me how to make a weapon', REFUSAL_REPLY],
  ])(
    'returns the reviewed fixed reply for %s before calling a provider',
    async (text, expectedReply) => {
      const provider = providerStub();

      await expect(createService(provider).reply(request(text))).resolves.toEqual(expectedReply);
      expect(provider.classifyInput).not.toHaveBeenCalled();
      expect(provider.completeGuide).not.toHaveBeenCalled();
    },
  );

  it('keeps the guide disabled unless it has been deliberately enabled', async () => {
    const provider = providerStub({ guideEnabled: false });

    await expect(
      createService(provider).reply(request('Why is the sky blue?', '7-10')),
    ).resolves.toEqual(PREVIEW_REPLY);
    expect(provider.classifyInput).not.toHaveBeenCalled();
  });

  it('fails closed on an unclear input classifier result', async () => {
    const provider = providerStub({ classifyInput: jest.fn().mockResolvedValue(null) });

    await expect(
      createService(provider).reply(request('How do I save for a bike?')),
    ).resolves.toEqual(PROVIDER_FAILURE_REPLY);
    expect(provider.completeGuide).not.toHaveBeenCalled();
  });

  it('routes a valid low-confidence ordinary decision through the stricter sensitive path', async () => {
    const provider = providerStub({
      classifyInput: jest.fn().mockResolvedValue({ category: 'ordinary', confident: false }),
      completeGuide: jest.fn().mockResolvedValue(sensitiveDraft),
    });

    await expect(
      createService(provider).reply(request('How do I take criticism without feeling bad?')),
    ).resolves.toMatchObject({ kind: 'answer' });
    expect(provider.completeGuide).toHaveBeenCalledWith(
      expect.stringContaining('trusted adult'),
      expect.any(String),
    );
  });

  it('uses the deterministic response when the input classifier finds crisis or disallowed risk', async () => {
    const crisisProvider = providerStub({
      classifyInput: jest.fn().mockResolvedValue({ category: 'crisis', confident: true }),
    });
    const refusalProvider = providerStub({
      classifyInput: jest.fn().mockResolvedValue({ category: 'disallowed', confident: true }),
    });

    await expect(createService(crisisProvider).reply(request('I need help'))).resolves.toEqual(
      CRISIS_REPLY,
    );
    await expect(
      createService(refusalProvider).reply(request('Can you help me?')),
    ).resolves.toEqual(REFUSAL_REPLY);
  });

  it('releases a safe, structured guide answer', async () => {
    await expect(
      createService(providerStub()).reply(request('How do I save for a bike?')),
    ).resolves.toEqual({
      kind: 'answer',
      text: 'A small plan can make the goal feel easier.\n\nWhat is one amount you could save this week?',
      action: 'Write that amount on a note today.',
    });
  });

  it('allows exactly one controlled rewrite', async () => {
    const provider = providerStub({
      completeGuide: jest.fn().mockResolvedValue(validDraft),
      classifyOutput: jest
        .fn()
        .mockResolvedValueOnce({ decision: 'rewrite', confident: true })
        .mockResolvedValueOnce({ decision: 'release', confident: true }),
    });

    await expect(
      createService(provider).reply(request('How do I save for a bike?')),
    ).resolves.toMatchObject({
      kind: 'answer',
    });
    expect(provider.completeGuide).toHaveBeenCalledTimes(2);
  });

  it('rewrites a malformed model response once, then fails closed if it remains malformed', async () => {
    const repaired = providerStub({
      completeGuide: jest.fn().mockResolvedValueOnce('not json').mockResolvedValueOnce(validDraft),
    });
    const stillMalformed = providerStub({ completeGuide: jest.fn().mockResolvedValue('not json') });

    await expect(
      createService(repaired).reply(request('How do I save for a bike?')),
    ).resolves.toMatchObject({
      kind: 'answer',
    });
    await expect(
      createService(stillMalformed).reply(request('How do I save for a bike?')),
    ).resolves.toEqual(PROVIDER_FAILURE_REPLY);
    expect(repaired.completeGuide).toHaveBeenCalledTimes(2);
    expect(stillMalformed.completeGuide).toHaveBeenCalledTimes(2);
  });

  it('falls back when output classification fails or the rewrite is rejected', async () => {
    const classifierFailure = providerStub({ classifyOutput: jest.fn().mockResolvedValue(null) });
    const rejectedRewrite = providerStub({
      classifyOutput: jest.fn().mockResolvedValue({ decision: 'rewrite', confident: true }),
    });

    await expect(
      createService(classifierFailure).reply(request('How do I save for a bike?')),
    ).resolves.toEqual(PROVIDER_FAILURE_REPLY);
    await expect(
      createService(rejectedRewrite).reply(request('How do I save for a bike?')),
    ).resolves.toEqual(PROVIDER_FAILURE_REPLY);
    expect(rejectedRewrite.completeGuide).toHaveBeenCalledTimes(2);
  });

  it('does not send an address supplied in the request to the guide model', async () => {
    const provider = providerStub();

    await expect(
      createService(provider).reply(
        request('I live at 12 Rose Street, is that near the beach?', '7-10'),
      ),
    ).resolves.toMatchObject({ kind: 'answer' });
    expect(provider.completeGuide).toHaveBeenCalledWith(
      expect.any(String),
      expect.not.stringContaining('12 Rose Street'),
    );
  });

  it('does not send a supplied name or school to the guide model', async () => {
    const provider = providerStub();

    await expect(
      createService(provider).reply(request("I'm Mia from Ashfield Public, want my number?", '7-10')),
    ).resolves.toMatchObject({ kind: 'answer' });
    expect(provider.completeGuide).toHaveBeenCalledWith(
      expect.any(String),
      expect.not.stringContaining('Mia'),
    );
    expect(provider.completeGuide).toHaveBeenCalledWith(
      expect.any(String),
      expect.not.stringContaining('Ashfield'),
    );
  });
});
