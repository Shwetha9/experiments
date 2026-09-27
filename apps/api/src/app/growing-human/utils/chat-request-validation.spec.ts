import { oversizedChatRequest, validChatRequest } from '../test-fixtures/chat-requests';
import { parseChatRequest } from './chat-request-validation';

describe('parseChatRequest', () => {
  it('accepts a contract-valid request and rejects one that breaks the limits', () => {
    expect(parseChatRequest(validChatRequest)?.messages[0].text).toBe(
      'Why do I feel angry so quickly?',
    );
    expect(parseChatRequest(oversizedChatRequest)).toBeNull();
  });
});
