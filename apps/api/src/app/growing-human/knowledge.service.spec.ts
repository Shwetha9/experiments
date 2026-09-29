import { ConfigService } from '@nestjs/config';
import { REVIEWED_KNOWLEDGE } from '@shwetha/growing-human-contracts';
import { KnowledgeService } from './knowledge.service';

describe('KnowledgeService', () => {
  const originalFetch = global.fetch;
  const config = { get: () => 'test-key' } as unknown as ConfigService;
  const service = new KnowledgeService(config);

  afterEach(() => { global.fetch = originalFetch; });

  it('uses the safe API Ninjas Facts endpoint for surprise finds', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true, json: async () => [{ fact: 'A surprising science fact.' }],
    });
    global.fetch = fetchMock;

    expect(await service.scout('surprise')).toEqual({
      category: 'surprise', kind: 'fact', text: 'A surprising science fact.', source: 'api-ninjas',
    });
    expect(fetchMock.mock.calls[0][0].toString()).toBe('https://api.api-ninjas.com/v1/facts?safe=true');
    expect(fetchMock.mock.calls[0][1].headers['X-Api-Key']).toBe('test-key');
  });

  it('uses category and safe filters for trivia', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true, json: async () => [{ question: 'Which ocean is largest?', answer: 'Pacific Ocean.' }],
    });
    global.fetch = fetchMock;

    expect((await service.scout('places')).source).toBe('api-ninjas');
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      'https://api.api-ninjas.com/v1/trivia?safe=true&category=geography',
    );
  });

  it('uses reviewed content when premium filtering is unavailable', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });
    expect(await service.scout('places')).toEqual(REVIEWED_KNOWLEDGE.places);
  });
});
