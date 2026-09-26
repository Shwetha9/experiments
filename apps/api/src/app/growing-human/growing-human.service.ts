import { Injectable } from '@nestjs/common';
import { ChatReply, ChatRequest, PREVIEW_REPLY } from '@shwetha/growing-human-contracts';

/**
 * BFF entry point. The model stays off until every launch gate in spec §5.6 passes,
 * so each valid request gets the fixed preview reply. Messages are never stored or logged.
 */
@Injectable()
export class GrowingHumanService {
  reply(_request: ChatRequest): ChatReply {
    return PREVIEW_REPLY;
  }
}
