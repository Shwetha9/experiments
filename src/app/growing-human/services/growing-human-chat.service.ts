import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { ChatReply, ChatRequest } from '../models/growing-human';

const PREVIEW_REPLY: ChatReply = {
  kind: 'preview',
  text: 'Thank you for asking. Growing Human is still being built, so I’m not able to answer yet. The guide is only switched on after every safety check has been reviewed.',
  action: 'In the meantime, a trusted adult is a great person to explore this question with.',
};

/**
 * Phase 1 offline preview. It never calls a model and never pretends to answer.
 * Phase 2 swaps the body for a call to the NestJS BFF with the same signature.
 */
@Injectable({ providedIn: 'root' })
export class GrowingHumanChatService {
  reply(_request: ChatRequest): Observable<ChatReply> {
    return of(PREVIEW_REPLY).pipe(delay(600));
  }
}
