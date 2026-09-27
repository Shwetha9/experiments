import { Injectable } from '@nestjs/common';
import {
  ChatReply,
  ChatRequest,
  CRISIS_REPLY,
  PREVIEW_REPLY,
  PROVIDER_FAILURE_REPLY,
  REFUSAL_REPLY,
} from '@shwetha/growing-human-contracts';
import { InputSafetyService } from './safety/input-safety.service';

/**
 * BFF entry point. The model stays off until every launch gate in spec §5.6 passes,
 * so each valid request gets the fixed preview reply. Messages are never stored or logged.
 */
@Injectable()
export class GrowingHumanService {
  constructor(private readonly inputSafety: InputSafetyService) {}

  reply(request: ChatRequest): ChatReply {
    const latestMessage = request.messages[request.messages.length - 1];
    if (!latestMessage) return PROVIDER_FAILURE_REPLY;
    const decision = this.inputSafety.decide(latestMessage.text);
    if (decision === 'crisis') return CRISIS_REPLY;
    if (decision === 'disallowed') return REFUSAL_REPLY;
    return PREVIEW_REPLY;
  }
}
