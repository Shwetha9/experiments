import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CHAT_ENDPOINT, PROVIDER_FAILURE_REPLY } from '@shwetha/growing-human-contracts';
import { Observable, catchError, of } from 'rxjs';
import { ChatReply, ChatRequest } from '../models/growing-human';

/**
 * Sends the chat to the NestJS BFF. The BFF owns every safety decision; any error
 * (including a 429 from rate limiting) becomes the signed-off provider-failure reply.
 */
@Injectable({ providedIn: 'root' })
export class GrowingHumanChatService {
  private readonly http = inject(HttpClient);

  reply(request: ChatRequest): Observable<ChatReply> {
    return this.http
      .post<ChatReply>(CHAT_ENDPOINT, request)
      .pipe(catchError(() => of(PROVIDER_FAILURE_REPLY)));
  }
}
