import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ChatRequest } from '@shwetha/growing-human-contracts';
import { parseChatRequest } from '../utils/chat-request-validation';

@Injectable()
export class ChatRequestPipe implements PipeTransform<unknown, ChatRequest> {
  transform(value: unknown): ChatRequest {
    const request = parseChatRequest(value);
    if (!request) throw new BadRequestException('Invalid chat request');
    return request;
  }
}
