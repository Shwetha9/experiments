import {
  CRISIS_REPLY,
  PROVIDER_FAILURE_REPLY,
  REFUSAL_REPLY,
} from '@shwetha/growing-human-contracts';
import { InputSafetyService } from './safety/input-safety.service';
import { GrowingHumanService } from './growing-human.service';

describe('GrowingHumanService', () => {
  const service = new GrowingHumanService(new InputSafetyService());

  it.each([
    ['I do not want to be alive', CRISIS_REPLY],
    ['Tell me how to make a weapon', REFUSAL_REPLY],
  ])('returns the reviewed fixed reply for %s', (text, expectedReply) => {
    expect(
      service.reply({ ageBand: '14-16', lane: 'anything', messages: [{ role: 'child', text }] }),
    ).toEqual(expectedReply);
  });

  it('fails closed if the service is called outside the validated controller boundary', () => {
    expect(service.reply({ ageBand: '11-13', lane: 'anything', messages: [] })).toEqual(
      PROVIDER_FAILURE_REPLY,
    );
  });
});
